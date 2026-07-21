"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, Rocket } from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { motion } from "framer-motion";

type GameState = "idle" | "playing" | "crashed";

export default function CrashPage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();
  
  const [gameState, setGameState] = useState<GameState>("idle");
  const [bet, setBet] = useState(10);
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(1.0);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [winAmount, setWinAmount] = useState(0);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Function to determine crash point (house edge built in)
  const generateCrashPoint = () => {
    const e = 2 ** 32;
    const h = crypto.getRandomValues(new Uint32Array(1))[0];
    if (h % 100 < 3) return 1.0; // ~3% instant crash
    
    const p = (e - h) / e;
    return Math.max(1.01, 0.99 / p);
  };

  const startGame = async () => {
    if (balance < bet) return;
    if (!await deductBalance(bet)) return;

    setGameState("playing");
    setMultiplier(1.0);
    setHasCashedOut(false);
    setWinAmount(0);
    setCrashPoint(generateCrashPoint());
    startTimeRef.current = performance.now();

    const updateMultiplier = (time: number) => {
      if (!startTimeRef.current) return;
      
      const elapsed = (time - startTimeRef.current) / 1000;
      // Growth function: e^(0.06 * t)
      const currentMultiplier = Math.max(1.0, Math.exp(0.06 * elapsed));

      if (currentMultiplier >= crashPoint) {
        setMultiplier(crashPoint);
        setGameState("crashed");
        // We log the loss when it crashes and the user hasn't cashed out yet.
        // We can't log it directly inside here because it's a tight loop and state isn't fresh.
        // So we just set state and let a useEffect handle the log for bust, 
        // OR we just assume they lost if they didn't trigger cashOut.
        return; // End animation
      }

      setMultiplier(currentMultiplier);
      requestRef.current = requestAnimationFrame(updateMultiplier);
    };

    requestRef.current = requestAnimationFrame(updateMultiplier);
  };

  const cashOut = async () => {
    if (gameState !== "playing" || hasCashedOut) return;

    if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
    }
    
    setHasCashedOut(true);
    const won = bet * multiplier;
    setWinAmount(won);
    await addBalance(won);
    logGame('crash', bet, won, multiplier);
    
    // Let animation finish before resetting to idle
    setTimeout(() => {
        setGameState("idle");
    }, 2000);
  };

  useEffect(() => {
      if (gameState === "crashed" && !hasCashedOut) {
          logGame('crash', bet, 0, 0);
      }
  }, [gameState, hasCashedOut, bet, logGame]);

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  if (kycStatus !== "approved") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">KYC Required</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Please complete identity verification to access the Crash game.
          </p>
        </div>
        <Link 
          href="/kyc" 
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
        >
          Verify Identity
        </Link>
      </div>
    );
  }

  const rocketX = Math.min(90, (multiplier - 1) * 5); // Controls horizontal movement
  const rocketY = Math.max(10, 80 - Math.log(multiplier + 1) * 30); // Controls vertical movement

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center gap-8 py-8">
      
      {/* Game Display */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden h-[450px] flex flex-col">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />
        
        {/* Graph Area */}
        <div className="flex-grow relative">
            {gameState === 'playing' && (
                <motion.div
                    className="absolute z-20"
                    animate={{ x: `${rocketX}%`, y: `${rocketY}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                >
                    <Rocket className="w-10 h-10 text-blue-400 -rotate-45" />
                </motion.div>
            )}

            <div className="absolute inset-0 flex items-center justify-center">
                <div className="z-10 text-center">
                    <div className={cn(
                        "text-7xl md:text-9xl font-black font-mono transition-colors duration-100",
                        gameState === "crashed" ? "text-red-500" : 
                        hasCashedOut ? "text-emerald-400" : "text-white"
                    )}>
                        {multiplier.toFixed(2)}x
                    </div>
                    
                    <div className="h-12 mt-4">
                        {gameState === "crashed" && !hasCashedOut && (
                            <div className="text-2xl font-bold text-red-500 animate-pulse uppercase tracking-widest">
                                CRASHED
                            </div>
                        )}
                        {hasCashedOut && (
                            <div className="text-xl font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full inline-block border border-emerald-500/20">
                                Cashed out: +${winAmount.toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
          <div className="flex flex-col">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Bet Amount</label>
              <div className="flex items-center gap-4 bg-slate-950 rounded-xl p-2 border border-slate-800">
                  <button 
                      onClick={() => setBet(Math.max(10, bet - 10))}
                      disabled={gameState === "playing"}
                      className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-2xl font-bold transition-colors"
                  >-</button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-mono text-emerald-400 font-bold">${bet}</span>
                  </div>
                  <button 
                      onClick={() => setBet(bet + 10)}
                      disabled={gameState === "playing"}
                      className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-2xl font-bold transition-colors"
                  >+</button>
              </div>
          </div>

          {gameState === "playing" ? (
              <button
                  onClick={cashOut}
                  disabled={hasCashedOut}
                  className={cn("w-full py-6 rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] flex flex-col items-center gap-1",
                    hasCashedOut ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  )}
              >
                  <span>CASH OUT</span>
                  <span className="text-sm font-mono bg-black/20 px-3 py-1 rounded-full">
                      ${(bet * multiplier).toFixed(2)}
                  </span>
              </button>
          ) : (
              <button
                  onClick={startGame}
                  disabled={balance < bet}
                  className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] disabled:shadow-none flex items-center justify-center gap-3"
              >
                  <Rocket className="w-8 h-8" />
                  {gameState === "idle" && !hasCashedOut ? "START GAME" : "PLAY AGAIN"}
              </button>
          )}
      </div>
    </div>
  );
}

