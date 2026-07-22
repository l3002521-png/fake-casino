"use client";

import { useState } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, Play, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { motion } from "framer-motion";

type GameState = "idle" | "racing" | "result";

const CHICKEN_NAMES = ["🐔 Clucky", "🐓 Speedy", "🐔 Feathers", "🐓 Dash", "🐔 Turbo"];
const FINISH_LINE = 400;

export default function ChickenRunPage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();
  
  const [gameState, setGameState] = useState<GameState>("idle");
  const [bet, setBet] = useState(10);
  const [selectedChicken, setSelectedChicken] = useState(0);
  const [chickenPositions, setChickenPositions] = useState([0, 0, 0, 0, 0]);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [winAmount, setWinAmount] = useState(0);

  const runRace = async () => {
    if (gameState === "racing" || balance < bet) return;
    if (!await deductBalance(bet)) return;

    setGameState("racing");
    setWinAmount(0);
    setWinnerIndex(null);
    setChickenPositions([0, 0, 0, 0, 0]);

    const speeds = Array(5)
      .fill(0)
      .map(() => Math.random() * 2 + 1);
    let positions = [0, 0, 0, 0, 0];
    let winner: number | null = null;

    const animationInterval = setInterval(() => {
      positions = positions.map((pos, i) => {
        const newPos = pos + speeds[i];
        if (newPos >= FINISH_LINE && winner === null) {
          winner = i;
        }
        return Math.min(newPos, FINISH_LINE);
      });

      setChickenPositions([...positions]);

      if (winner !== null) {
        clearInterval(animationInterval);
        
        setTimeout(async () => {
          setWinnerIndex(winner);
          setGameState("result");

          if (selectedChicken === winner) {
            const multiplier = 4.5;
            const won = bet * multiplier;
            setWinAmount(won);
            await addBalance(won);
            logGame("chicken_run", bet, won, multiplier);
          } else {
            logGame("chicken_run", bet, 0, 0);
          }
        }, 500);
      }
    }, 30);
  };

  const resetGame = () => {
    setGameState("idle");
    setWinAmount(0);
    setWinnerIndex(null);
    setChickenPositions([0, 0, 0, 0, 0]);
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
            Please complete identity verification to access Chicken Run.
          </p>
        </div>
        <Link href="/kyc" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors">
          Verify Identity
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col items-center gap-8 py-8 px-4">
      
      {/* Game Display */}
      <div className="w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        
        {/* Result Message */}
        <div className="h-16 mb-6 flex items-center justify-center">
          {gameState === "result" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "text-4xl font-black uppercase tracking-widest text-center",
                winAmount > 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {winAmount > 0 ? `🎉 WON $${winAmount.toFixed(2)}!` : "❌ NO WIN"}
            </motion.div>
          )}
        </div>

        {/* Race Track */}
        <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-700/30 rounded-2xl p-6 space-y-4 mb-6">
          {chickenPositions.map((position, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={cn(
                  "font-bold",
                  winnerIndex === i && "text-emerald-400",
                  selectedChicken === i && gameState === "idle" && "text-blue-400"
                )}>
                  {CHICKEN_NAMES[i]}
                </span>
                <span className="text-xs text-slate-500">{Math.round(position)}m</span>
              </div>
              <div className="relative w-full h-12 bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50">
                <motion.div
                  animate={{ left: `${(position / FINISH_LINE) * 100}%` }}
                  transition={{ type: "tween", duration: 0 }}
                  className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center text-2xl shadow-lg"
                >
                  🐔
                </motion.div>
              </div>
            </div>
          ))}
        </div>

        {/* Finish Line Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-6 px-2">
          <span>START</span>
          <span className="font-bold text-emerald-500">🏁 FINISH</span>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
        
        {/* Bet Amount */}
        <div className="flex flex-col">
          <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Bet Amount</label>
          <div className="flex items-center gap-4 bg-slate-950 rounded-xl p-2 border border-slate-800">
            <button 
              onClick={() => setBet(Math.max(10, bet - 10))}
              disabled={gameState === "racing"}
              className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-2xl font-bold transition-colors"
            >-</button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-mono text-emerald-400 font-bold">${bet}</span>
            </div>
            <button 
              onClick={() => setBet(bet + 10)}
              disabled={gameState === "racing"}
              className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-2xl font-bold transition-colors"
            >+</button>
          </div>
        </div>

        {/* Select Chicken */}
        <div className="flex flex-col">
          <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3">Pick Your Chicken</label>
          <div className="grid grid-cols-5 gap-2">
            {CHICKEN_NAMES.map((name, i) => (
              <button
                key={i}
                onClick={() => setSelectedChicken(i)}
                disabled={gameState === "racing"}
                className={cn(
                  "py-3 rounded-lg font-bold text-sm transition-all border-2",
                  selectedChicken === i
                    ? "bg-blue-500/20 border-blue-500 text-blue-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600"
                )}
              >
                {name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Race/Play Again Button */}
        {gameState !== "result" ? (
          <button
            onClick={runRace}
            disabled={gameState === "racing" || balance < bet}
            className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] disabled:shadow-none flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6" /> Start Race
          </button>
        ) : (
          <button
            onClick={resetGame}
            className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] flex items-center justify-center gap-3"
          >
            <RotateCcw className="w-6 h-6" /> Race Again
          </button>
        )}
      </div>

      {/* Info */}
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-400 text-center space-y-2">
        <p>🏆 Bet on a chicken • Win 4.5x your bet if yours crosses first!</p>
        <p className="text-xs">Each race has randomized speeds for unpredictable results.</p>
      </div>
    </div>
  );
}
