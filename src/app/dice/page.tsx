"use client";

import { useState } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, Hexagon } from "lucide-react";
import Link from "next/link";

export default function DicePage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();
  
  const [bet, setBet] = useState(10);
  const [target, setTarget] = useState(50.00);
  const [gameState, setGameState] = useState<"idle" | "rolling" | "result">("idle");
  const [result, setResult] = useState(0);
  const [winAmount, setWinAmount] = useState(0);

  const winChance = target;
  const multiplier = winChance > 0 ? (99 / winChance) : 0; // 1% house edge

  const roll = async () => {
      if (gameState === "rolling" || balance < bet) return;
      if (!await deductBalance(bet)) return;

      setGameState("rolling");
      setWinAmount(0);

      setTimeout(async () => {
          const rollResult = Math.random() * 100;
          setResult(rollResult);
          setGameState("result");

          if (rollResult < target) {
              const won = bet * multiplier;
              setWinAmount(won);
              await addBalance(won);
              logGame("dice", bet, won, multiplier);
          } else {
              logGame("dice", bet, 0, 0);
          }
      }, 500);
  };

  if (kycStatus !== "approved") {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
              </div>
              <div>
                  <h2 className="text-3xl font-bold mb-2">KYC Required</h2>
                  <p className="text-slate-400 max-w-md mx-auto">Please complete identity verification to access Dice.</p>
              </div>
              <Link href="/kyc" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors">
                  Verify Identity
              </Link>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 py-8">
        
        {/* Controls */}
        <div className="w-full md:w-80 bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col gap-6 shrink-0 h-fit">
            <div className="flex flex-col">
                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Bet Amount</label>
                <div className="flex items-center gap-4 bg-slate-950 rounded-xl p-2 border border-slate-800">
                    <button 
                        onClick={() => setBet(Math.max(10, bet - 10))}
                        disabled={gameState === "rolling"}
                        className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-bold disabled:opacity-50"
                    >-</button>
                    <div className="flex-1 text-center">
                        <span className="text-xl font-mono text-blue-400 font-bold">${bet}</span>
                    </div>
                    <button 
                        onClick={() => setBet(bet + 10)}
                        disabled={gameState === "rolling"}
                        className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-bold disabled:opacity-50"
                    >+</button>
                </div>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Multiplier</span>
                    <span className="font-bold text-white">{multiplier.toFixed(4)}x</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Win Chance</span>
                    <span className="font-bold text-white">{winChance.toFixed(2)}%</span>
                </div>
            </div>

            <button
                onClick={roll}
                disabled={balance < bet || gameState === "rolling"}
                className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] disabled:shadow-none mt-auto flex items-center justify-center gap-2"
            >
                {gameState === "rolling" ? <Hexagon className="w-6 h-6 animate-spin" /> : "ROLL DICE"}
            </button>
        </div>

        {/* Board */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
            
            <div className="text-center mb-12">
                <div className="text-8xl font-black font-mono tracking-tighter mb-4" style={{ color: gameState === "result" ? (result < target ? "#34d399" : "#ef4444") : "white" }}>
                    {gameState === "idle" ? "00.00" : result.toFixed(2)}
                </div>
                <div className="h-8">
                    {gameState === "result" && (
                        <div className="text-xl font-bold" style={{ color: result < target ? "#34d399" : "#ef4444" }}>
                            {result < target ? `WON $${winAmount.toFixed(2)}` : "LOST"}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full max-w-md px-4">
                <div className="flex justify-between text-sm font-bold text-slate-400 mb-2">
                    <span>0</span>
                    <span>Roll Under {target.toFixed(2)}</span>
                    <span>100</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="98" 
                    step="0.01"
                    value={target}
                    onChange={(e) => setTarget(parseFloat(e.target.value))}
                    disabled={gameState === "rolling"}
                    className="w-full h-4 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                />
            </div>

        </div>

    </div>
  );
}