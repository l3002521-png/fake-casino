"use client";

import { useState } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, ArrowUp, ArrowDown, Equal } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

export default function HiLoPage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();
  
  const [bet, setBet] = useState(10);
  const [gameState, setGameState] = useState<"idle" | "playing">("idle");
  const [currentCard, setCurrentCard] = useState<number>(7);
  const [multiplier, setMultiplier] = useState(1.0);
  const [deck, setDeck] = useState<number[]>([]);

  const start = async () => {
      if (balance < bet) return;
      if (!await deductBalance(bet)) return;

      // Create and shuffle deck (1-13)
      const newDeck = Array.from({length: 52}, (_, i) => (i % 13) + 1).sort(() => Math.random() - 0.5);
      
      setCurrentCard(newDeck.pop()!);
      setDeck(newDeck);
      setMultiplier(1.0);
      setGameState("playing");
  };

  const guess = async (direction: "higher" | "lower" | "equal") => {
      if (gameState !== "playing" || deck.length === 0) return;

      const newDeck = [...deck];
      const nextCard = newDeck.pop()!;
      
      let won = false;
      let newMultiplier = multiplier;

      if (direction === "equal" && nextCard === currentCard) {
          won = true;
          newMultiplier *= 12; // High risk, high reward
      } else if (direction === "higher" && nextCard > currentCard) {
          won = true;
          newMultiplier *= 1 + (currentCard / 13); // Higher reward if current card was high
      } else if (direction === "lower" && nextCard < currentCard) {
          won = true;
          newMultiplier *= 1 + ((14 - currentCard) / 13);
      }

      setCurrentCard(nextCard);
      setDeck(newDeck);

      if (won) {
          setMultiplier(newMultiplier);
      } else {
          // BUST
          setGameState("idle");
          logGame("hilo", bet, 0, 0);
      }
  };

  const cashOut = async () => {
      if (gameState !== "playing" || multiplier <= 1.0) return;
      
      const won = bet * multiplier;
      await addBalance(won);
      logGame("hilo", bet, won, multiplier);
      setGameState("idle");
  };

  if (kycStatus !== "approved") {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
              </div>
              <div>
                  <h2 className="text-3xl font-bold mb-2">KYC Required</h2>
                  <p className="text-slate-400 max-w-md mx-auto">Please complete identity verification to access HiLo.</p>
              </div>
              <Link href="/kyc" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors">
                  Verify Identity
              </Link>
          </div>
      );
  }

  const getCardDisplay = (val: number) => {
      if (val === 1) return "A";
      if (val === 11) return "J";
      if (val === 12) return "Q";
      if (val === 13) return "K";
      return val.toString();
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 py-8">
        
        {/* Controls */}
        <div className="w-full md:w-80 bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col gap-6 shrink-0 h-fit">
            <div className="flex flex-col">
                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Bet Amount</label>
                <div className="flex items-center gap-4 bg-slate-950 rounded-xl p-2 border border-slate-800">
                    <button 
                        onClick={() => setBet(Math.max(10, bet - 10))}
                        disabled={gameState === "playing"}
                        className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-xl font-bold"
                    >-</button>
                    <div className="flex-1 text-center">
                        <span className="text-xl font-mono text-emerald-400 font-bold">${bet}</span>
                    </div>
                    <button 
                        onClick={() => setBet(bet + 10)}
                        disabled={gameState === "playing"}
                        className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-xl font-bold"
                    >+</button>
                </div>
            </div>

            {gameState === "playing" ? (
                <button
                    onClick={cashOut}
                    className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex flex-col items-center"
                >
                    <span>CASH OUT</span>
                    <span className="text-sm font-mono bg-black/20 px-3 py-1 rounded-full mt-1">
                        ${(bet * multiplier).toFixed(2)}
                    </span>
                </button>
            ) : (
                <button
                    onClick={start}
                    disabled={balance < bet}
                    className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] disabled:shadow-none"
                >
                    START GAME
                </button>
            )}
        </div>

        {/* Board */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center min-h-[500px]">
            
            <div className="h-12 w-full flex justify-end items-center mb-12">
                 <div className="text-slate-400 font-bold bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-xl">
                    Multiplier: <span className="text-white">{multiplier.toFixed(2)}x</span>
                 </div>
            </div>

            <div className="relative w-40 h-56 perspective-1000">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentCard}
                        initial={{ rotateY: 90, scale: 0.8, opacity: 0 }}
                        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                        exit={{ rotateY: -90, scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-slate-200"
                    >
                        <div className={cn(
                            "text-7xl font-black",
                            currentCard % 2 === 0 ? "text-red-500" : "text-slate-900"
                        )}>
                            {getCardDisplay(currentCard)}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full mt-12">
                <button 
                    onClick={() => guess("higher")}
                    disabled={gameState !== "playing"}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 rounded-xl py-6 flex flex-col items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                    <ArrowUp className="w-8 h-8" />
                    <span className="font-bold">HIGHER</span>
                </button>
                <button 
                    onClick={() => guess("equal")}
                    disabled={gameState !== "playing"}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl py-6 flex flex-col items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                    <Equal className="w-8 h-8" />
                    <span className="font-bold">SAME</span>
                </button>
                <button 
                    onClick={() => guess("lower")}
                    disabled={gameState !== "playing"}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl py-6 flex flex-col items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                    <ArrowDown className="w-8 h-8" />
                    <span className="font-bold">LOWER</span>
                </button>
            </div>

        </div>

    </div>
  );
}
