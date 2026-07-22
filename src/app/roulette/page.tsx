"use client";

import { useState } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, Target } from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { motion } from "framer-motion";

type GameState = "idle" | "spinning" | "result";

export default function RoulettePage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();
  
  const [gameState, setGameState] = useState<GameState>("idle");
  const [bet, setBet] = useState(10);
  const [selectedColor, setSelectedColor] = useState<"red" | "black" | "green" | null>("red");
  const [resultNumber, setResultNumber] = useState<number>(0);
  const [winAmount, setWinAmount] = useState(0);
  const [rotation, setRotation] = useState(0);

  const ROULETTE_NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ];

  const getColor = (num: number) => {
    if (num === 0) return "green";
    const redNumbers = [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3];
    return redNumbers.includes(num) ? "red" : "black";
  };

  const spin = async () => {
    if (gameState === "spinning" || balance < bet || !selectedColor) return;
    if (!await deductBalance(bet)) return;

    setGameState("spinning");
    setWinAmount(0);

    // Simulate rng
    const targetIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const targetNum = ROULETTE_NUMBERS[targetIndex];
    
    const segmentAngle = 360 / ROULETTE_NUMBERS.length;
    const targetMod = (360 - targetIndex * segmentAngle + 360) % 360;
    const currentMod = rotation % 360;
    const delta = ((targetMod - currentMod + 360) % 360) || 360;
    const nextRotation = rotation + 360 * 5 + delta;
    
    setRotation(nextRotation);

    setTimeout(async () => {
        setResultNumber(targetNum);
        setGameState("result");

        const landedColor = getColor(targetNum);
        if (landedColor === selectedColor) {
            const multiplier = selectedColor === "green" ? 12 : 1.95;
            const won = bet * multiplier;
            setWinAmount(won);
            await addBalance(won);
            logGame('roulette', bet, won, multiplier);
        } else {
            logGame('roulette', bet, 0, 0);
        }
    }, 4500);
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
            Please complete identity verification to access Roulette.
          </p>
        </div>
        <Link href="/kyc" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors">
          Verify Identity
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center gap-8 py-8">
      
      {/* Game Display */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
          
          <div className="h-16 mb-4">
              {gameState === "result" && (
                  <div className={cn(
                      "text-3xl font-black uppercase tracking-widest animate-in fade-in zoom-in duration-300",
                      winAmount > 0 ? "text-emerald-400" : "text-slate-500"
                  )}>
                      {winAmount > 0 ? `YOU WON $${winAmount.toFixed(2)}!` : "YOU LOST"}
                  </div>
              )}
          </div>

          {/* Simplified Roulette Wheel */}
          <div className="relative w-64 h-64 md:w-80 md:h-80">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 z-20 text-white drop-shadow-[0_0_5px_rgba(255,255,255,1)]">
                  <Target className="w-8 h-8 rotate-180" />
              </div>
              
              <motion.div 
                  className="w-full h-full rounded-full border-[16px] border-slate-950 relative overflow-hidden bg-slate-900 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]"
                  animate={{ rotate: rotation }}
                  transition={{ duration: 4.5, ease: "easeOut" }}
              >
                  {ROULETTE_NUMBERS.map((num, i) => {
                      const color = getColor(num);
                      return (
                          <div 
                              key={num}
                              className="absolute top-0 left-1/2 origin-bottom w-12 h-1/2 -translate-x-1/2 flex items-start justify-center pt-2 text-xs font-bold"
                              style={{ 
                                  transform: `translateX(-50%) rotate(${i * (360 / 37)}deg)`,
                                  backgroundColor: color === "green" ? "#22c55e" : color === "red" ? "#ef4444" : "#1e293b",
                                  clipPath: "polygon(50% 100%, 0 0, 100% 0)"
                              }}
                          >
                              <span className="text-white drop-shadow-md">{num}</span>
                          </div>
                      );
                  })}
                  {/* Center Hub */}
                  <div className="absolute inset-0 m-auto w-16 h-16 bg-slate-800 rounded-full border-4 border-slate-950 z-10 flex items-center justify-center">
                    <div className="w-8 h-8 bg-slate-900 rounded-full" />
                  </div>
              </motion.div>
          </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
          <div className="flex flex-col">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Bet Amount</label>
              <div className="flex items-center gap-4 bg-slate-950 rounded-xl p-2 border border-slate-800">
                  <button 
                      onClick={() => setBet(Math.max(10, bet - 10))}
                      disabled={gameState === "spinning"}
                      className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-2xl font-bold transition-colors"
                  >-</button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-mono text-emerald-400 font-bold">${bet}</span>
                  </div>
                  <button 
                      onClick={() => setBet(bet + 10)}
                      disabled={gameState === "spinning"}
                      className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-2xl font-bold transition-colors"
                  >+</button>
              </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
              <button 
                  onClick={() => setSelectedColor("red")}
                  disabled={gameState === "spinning"}
                  className={cn(
                      "py-4 rounded-xl font-bold uppercase tracking-wider transition-all border-2 flex flex-col items-center",
                      selectedColor === "red" ? "bg-red-500/20 border-red-500 text-red-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                  )}
              >
                  <div className="w-6 h-6 rounded-full bg-red-500 mb-2" />
                  1.95x
              </button>
              <button 
                  onClick={() => setSelectedColor("green")}
                  disabled={gameState === "spinning"}
                  className={cn(
                      "py-4 rounded-xl font-bold uppercase tracking-wider transition-all border-2 flex flex-col items-center",
                      selectedColor === "green" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                  )}
              >
                  <div className="w-6 h-6 rounded-full bg-emerald-500 mb-2" />
                  12x
              </button>
              <button 
                  onClick={() => setSelectedColor("black")}
                  disabled={gameState === "spinning"}
                  className={cn(
                      "py-4 rounded-xl font-bold uppercase tracking-wider transition-all border-2 flex flex-col items-center",
                      selectedColor === "black" ? "bg-slate-700 border-slate-500 text-white" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                  )}
              >
                  <div className="w-6 h-6 rounded-full bg-slate-800 mb-2 border border-slate-600" />
                  1.95x
              </button>
          </div>

          <button
              onClick={spin}
              disabled={gameState === "spinning" || balance < bet}
              className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] disabled:shadow-none flex items-center justify-center gap-3"
          >
              SPIN WHEEL
          </button>
      </div>

    </div>
  );
}
