"use client";

import { useState } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, Target } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function PlinkoPage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();
  
  const [bet, setBet] = useState(10);
  const [balls, setBalls] = useState<{ id: number; resultIndex: number; leftOffset: number }[]>([]);
  const [isDropping, setIsDropping] = useState(false);
  const [ballIdCounter, setBallIdCounter] = useState(0);

  // Binomial(8, 0.5) distribution — center-heavy, ~12% house edge
  const MULTIPLIERS = [8, 2.5, 1, 0.4, 0.15, 0.4, 1, 2.5, 8];
  const PINS_ROWS = 8;

  const dropBall = async () => {
    if (balance < bet || isDropping) return;
    if (!await deductBalance(bet)) return;

    setIsDropping(true);

    let resultIndex = 0;
    for (let i = 0; i < PINS_ROWS; i++) {
        if (Math.random() > 0.5) resultIndex++;
    }

    const id = ballIdCounter;
    const newBall = { id, resultIndex, leftOffset: 50 };
    setBalls(prev => [...prev, newBall]);
    setBallIdCounter(prev => prev + 1);

    setTimeout(async () => {
        const multiplier = MULTIPLIERS[resultIndex];
        const won = bet * multiplier;
        if (won > 0) {
            await addBalance(won);
        }
        logGame('plinko', bet, won, multiplier);

        setTimeout(() => {
            setBalls(prev => {
                const next = prev.filter(b => b.id !== id);
                if (next.length === 0) setIsDropping(false);
                return next;
            });
        }, 1000);
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
                  <p className="text-slate-400 max-w-md mx-auto">Please complete identity verification to access Plinko.</p>
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
                        className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-bold"
                    >-</button>
                    <div className="flex-1 text-center">
                        <span className="text-xl font-mono text-fuchsia-400 font-bold">${bet}</span>
                    </div>
                    <button 
                        onClick={() => setBet(bet + 10)}
                        className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-bold"
                    >+</button>
                </div>
            </div>

            <button
                onClick={dropBall}
                disabled={balance < bet || isDropping}
                className="w-full py-6 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:shadow-[0_0_50px_rgba(217,70,239,0.5)] disabled:shadow-none"
            >
                DROP
            </button>
        </div>

        {/* Board */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center min-h-[500px] relative overflow-hidden">
            
            {/* Pyramid Base Area */}
            <div className="w-full max-w-md aspect-square relative mt-8">
                
                {/* Pins */}
                {Array.from({ length: PINS_ROWS }).map((_, row) => (
                    <div key={row} className="flex justify-center w-full absolute" style={{ top: `${(row / PINS_ROWS) * 80}%` }}>
                        {Array.from({ length: row + 3 }).map((_, pin) => (
                            <div key={pin} className="w-2 h-2 rounded-full bg-slate-700 mx-3 shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
                        ))}
                    </div>
                ))}

                {/* Animated Balls */}
                <AnimatePresence>
                    {balls.map(ball => {
                        const targetX = 10 + (ball.resultIndex * 10);
                        const steps = PINS_ROWS;
                        
                        // Generate keyframes for smooth descent
                        const keyframes = Array.from({ length: steps + 2 }, (_, i) => {
                            const progress = i / (steps + 1);
                            const expectedX = 50 + (targetX - 50) * progress;
                            const jitter = Math.random() > 0.5 ? -3 : 3;
                            const x = expectedX + jitter;
                            const y = progress * 85;
                            return { x, y, progress };
                        });

                        const finalX = keyframes[keyframes.length - 1].x;
                        const finalY = keyframes[keyframes.length - 1].y;

                        return (
                            <motion.div
                                key={ball.id}
                                initial={{ left: "50%", top: "-10%", opacity: 1 }}
                                animate={{ 
                                    left: [...keyframes.map(kf => `${kf.x}%`), `${finalX}%`],
                                    top: [...keyframes.map(kf => `${kf.y}%`), `${finalY}%`]
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ 
                                    duration: 2,
                                    ease: "linear"
                                }}
                                className="absolute w-4 h-4 rounded-full bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.8)] z-10 transform -translate-x-1/2 -translate-y-1/2"
                            />
                        )
                    })}
                </AnimatePresence>

                {/* Multipliers at bottom */}
                <div className="absolute bottom-0 w-full flex justify-between px-2">
                    {MULTIPLIERS.map((mult, i) => (
                        <div key={i} className="text-[10px] sm:text-xs font-bold text-center w-8 py-2 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
                            {mult}x
                        </div>
                    ))}
                </div>

            </div>
        </div>

    </div>
  );
}