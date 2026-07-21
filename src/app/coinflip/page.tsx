"use client";

import { useState } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, Coins } from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Side = "heads" | "tails" | null;
type GameState = "idle" | "flipping" | "result";

export default function CoinflipPage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();
  
  const [gameState, setGameState] = useState<GameState>("idle");
  const [bet, setBet] = useState(10);
  const [selectedSide, setSelectedSide] = useState<Side>("heads");
  const [resultSide, setResultSide] = useState<Side>(null);
  const [winAmount, setWinAmount] = useState(0);

  const flip = async () => {
    if (gameState === "flipping" || balance < bet || !selectedSide) return;

    if (!await deductBalance(bet)) return;

    setGameState("flipping");
    setResultSide(null);
    setWinAmount(0);

    // Simulate backend RNG delay and flip animation
    setTimeout(async () => {
        const isHeads = Math.random() > 0.5;
        const result: Side = isHeads ? "heads" : "tails";
        setResultSide(result);
        setGameState("result");

        if (result === selectedSide) {
            const won = bet * 1.95; // 5% house edge
            setWinAmount(won);
            await addBalance(won);
            logGame('coinflip', bet, won, 1.95);
        } else {
            logGame('coinflip', bet, 0, 0);
        }
    }, 2000);
  };

  if (kycStatus !== "approved") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">KYC Required</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Please complete identity verification to access Coin Flip.
          </p>
        </div>
        <Link href="/kyc" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors">
          Verify Identity
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center gap-8 py-8">
      
      {/* Game Display Area */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
          
          <div className="h-16 mb-8">
              {gameState === "result" && resultSide && (
                  <div className={cn(
                      "text-3xl font-black uppercase tracking-widest animate-in fade-in zoom-in duration-300",
                      resultSide === selectedSide ? "text-emerald-400" : "text-slate-500"
                  )}>
                      {resultSide === selectedSide ? `YOU WON $${winAmount.toFixed(2)}!` : "YOU LOST"}
                  </div>
              )}
          </div>

          <div className="relative w-48 h-48 [perspective:1000px]">
              <motion.div 
                  className="w-full h-full relative [transform-style:preserve-3d]"
                  animate={{ 
                      rotateX: gameState === "flipping" ? 1800 : (gameState === "result" && resultSide === "tails" ? 180 : 0) 
                  }}
                  transition={{ 
                      duration: gameState === "flipping" ? 2 : 0.5, 
                      ease: gameState === "flipping" ? "linear" : "easeOut"
                  }}
              >
                  {/* Heads Side */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-300 to-amber-600 rounded-full flex items-center justify-center border-8 border-amber-700 [backface-visibility:hidden] shadow-[0_0_50px_rgba(251,191,36,0.3)]">
                      <div className="text-6xl font-black text-amber-900 opacity-80">H</div>
                  </div>
                  
                  {/* Tails Side */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center border-8 border-slate-600 [backface-visibility:hidden] [transform:rotateX(180deg)] shadow-[0_0_50px_rgba(148,163,184,0.3)]">
                      <div className="text-6xl font-black text-slate-800 opacity-80">T</div>
                  </div>
              </motion.div>
          </div>

      </div>

      {/* Controls */}
      <div className="w-full max-w-md bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
          <div className="flex flex-col">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Bet Amount</label>
              <div className="flex items-center gap-4 bg-slate-950 rounded-xl p-2 border border-slate-800">
                  <button 
                      onClick={() => setBet(Math.max(10, bet - 10))}
                      disabled={gameState === "flipping"}
                      className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-2xl font-bold transition-colors"
                  >-</button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-mono text-emerald-400 font-bold">${bet}</span>
                  </div>
                  <button 
                      onClick={() => setBet(bet + 10)}
                      disabled={gameState === "flipping"}
                      className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-2xl font-bold transition-colors"
                  >+</button>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <button 
                  onClick={() => setSelectedSide("heads")}
                  disabled={gameState === "flipping"}
                  className={cn(
                      "py-4 rounded-xl font-bold text-xl uppercase tracking-wider transition-all border-2",
                      selectedSide === "heads" 
                          ? "bg-amber-500/20 border-amber-500 text-amber-400" 
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                  )}
              >
                  HEADS
              </button>
              <button 
                  onClick={() => setSelectedSide("tails")}
                  disabled={gameState === "flipping"}
                  className={cn(
                      "py-4 rounded-xl font-bold text-xl uppercase tracking-wider transition-all border-2",
                      selectedSide === "tails" 
                          ? "bg-slate-500/20 border-slate-400 text-slate-300" 
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                  )}
              >
                  TAILS
              </button>
          </div>

          <button
              onClick={flip}
              disabled={gameState === "flipping" || balance < bet}
              className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] disabled:shadow-none flex items-center justify-center gap-3"
          >
              {gameState === "flipping" ? (
                  <Coins className="w-8 h-8 animate-bounce" />
              ) : (
                  "FLIP COIN"
              )}
          </button>
      </div>

    </div>
  );
}