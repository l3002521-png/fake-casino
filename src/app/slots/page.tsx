"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, RotateCw } from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣"];
const PAYOUTS: Record<string, number> = {
  "7️⃣": 50,
  "💎": 25,
  "🍇": 10,
  "🍊": 5,
  "🍋": 3,
  "🍒": 2,
};

export default function SlotsPage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();
  
  const [reels, setReels] = useState<string[]>(["🍒", "🍒", "🍒"]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [bet, setBet] = useState(10);
  const [message, setMessage] = useState("Place your bet and spin!");
  const [winAmount, setWinAmount] = useState(0);

  const spin = useCallback(() => {
    if (isSpinning || balance < bet) return;

    if (!deductBalance(bet)) return;

    setIsSpinning(true);
    setMessage("Spinning...");
    setWinAmount(0);

    const spinDuration = 2000;
    const intervalTime = 100;
    
    const interval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
    }, intervalTime);

    setTimeout(() => {
      clearInterval(interval);
      
      // Final result determination
      const finalReels = [
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ];
      
      setReels(finalReels);
      setIsSpinning(false);

      checkWin(finalReels);
    }, spinDuration);
  }, [balance, bet, deductBalance, isSpinning]);

  const checkWin = (currentReels: string[]) => {
    if (currentReels[0] === currentReels[1] && currentReels[1] === currentReels[2]) {
      const symbol = currentReels[0];
      const payoutMultiplier = PAYOUTS[symbol] || 1;
      const won = bet * payoutMultiplier;
      
      addBalance(won);
      setWinAmount(won);
      setMessage(`JACKPOT! You won $${won}!`);
      logGame('slots', bet, won, payoutMultiplier);
    } else if (currentReels[0] === currentReels[1] || currentReels[1] === currentReels[2] || currentReels[0] === currentReels[2]) {
        // Small payout for 2 matching
        const won = bet * 1.5;
        addBalance(won);
        setWinAmount(won);
        setMessage(`Nice! You won $${won}!`);
        logGame('slots', bet, won, 1.5);
    } else {
      setMessage("No luck this time. Try again!");
      logGame('slots', bet, 0, 0);
    }
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
            Please complete identity verification to access the slots.
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

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center gap-8 py-12">
      
      <div className="w-full bg-slate-900 border-[8px] border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Lights */}
        <div className="absolute inset-0 border-[4px] border-dashed border-fuchsia-500/30 rounded-2xl pointer-events-none" />

        <div className="text-center mb-8 h-12 flex items-center justify-center">
            {winAmount > 0 ? (
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-amber-400 animate-pulse">
                    {message}
                </div>
            ) : (
                <div className="text-xl font-bold text-slate-300">
                    {message}
                </div>
            )}
        </div>

        {/* Reels Container */}
        <div className="flex justify-center gap-4 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner mb-8 relative">
          
          {/* Win Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500/50 -translate-y-1/2 z-10 pointer-events-none shadow-[0_0_15px_rgba(239,68,68,0.5)]" />

          {reels.map((symbol, i) => (
            <div 
              key={i} 
              className="w-24 h-32 md:w-32 md:h-40 bg-white rounded-lg flex items-center justify-center text-5xl md:text-7xl shadow-lg relative overflow-hidden"
            >
              <div className={cn(
                "transition-transform duration-100 ease-linear",
                isSpinning ? "animate-[spin_0.2s_linear_infinite] blur-[2px]" : ""
              )}>
                {symbol}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-950 p-6 rounded-xl border border-slate-800">
            
            <div className="flex flex-col items-center">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Bet Amount</span>
                <div className="flex items-center gap-4 bg-slate-900 rounded-full p-1 border border-slate-700">
                    <button 
                        onClick={() => setBet(Math.max(10, bet - 10))}
                        disabled={isSpinning}
                        className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-xl font-bold"
                    >-</button>
                    <div className="text-2xl font-mono text-fuchsia-400 w-20 text-center font-bold">
                        ${bet}
                    </div>
                    <button 
                        onClick={() => setBet(bet + 10)}
                        disabled={isSpinning}
                        className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-xl font-bold"
                    >+</button>
                </div>
            </div>

            <button
                onClick={spin}
                disabled={isSpinning || balance < bet}
                className={cn(
                    "relative group px-12 py-6 rounded-2xl font-black text-2xl uppercase tracking-widest transition-all",
                    isSpinning || balance < bet 
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-gradient-to-b from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white shadow-[0_0_40px_rgba(217,70,239,0.4)] hover:shadow-[0_0_60px_rgba(217,70,239,0.6)] active:scale-95"
                )}
            >
                {isSpinning ? (
                    <RotateCw className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                    "SPIN"
                )}
            </button>
        </div>

      </div>

    </div>
  );
}
