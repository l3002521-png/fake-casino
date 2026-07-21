"use client";

import { useState } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { motion } from "framer-motion";

type GameState = "picking" | "drawing" | "result";

// Payout multipliers: PAYOUTS[picks][hits]
const PAYOUTS: Record<number, Record<number, number>> = {
  1: { 1: 3.5 },
  2: { 2: 12 },
  3: { 2: 2, 3: 42 },
  4: { 2: 1, 3: 4, 4: 100 },
  5: { 3: 2, 4: 12, 5: 500 },
  6: { 3: 1, 4: 4, 5: 60, 6: 1000 },
  7: { 4: 2, 5: 20, 6: 200, 7: 5000 },
  8: { 4: 1, 5: 8, 6: 50, 7: 500, 8: 10000 },
  9: { 4: 1, 5: 5, 6: 25, 7: 200, 8: 2000, 9: 25000 },
  10: { 5: 2, 6: 15, 7: 100, 8: 1000, 9: 5000, 10: 50000 },
};

const MAX_PICKS = 10;
const DRAW_COUNT = 20;

export default function KenoPage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();

  const [bet, setBet] = useState(10);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [drawn, setDrawn] = useState<Set<number>>(new Set());
  const [gameState, setGameState] = useState<GameState>("picking");
  const [hits, setHits] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);

  const toggleNumber = (n: number) => {
    if (gameState !== "picking") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else if (next.size < MAX_PICKS) next.add(n);
      return next;
    });
  };

  const play = async () => {
    if (selected.size === 0 || balance < bet || gameState !== "picking") return;
    if (!await deductBalance(bet)) return;

    setGameState("drawing");
    setWinAmount(0);
    setRevealedCount(0);

    const pool = Array.from({ length: 80 }, (_, i) => i + 1);
    const winning: number[] = [];
    while (winning.length < DRAW_COUNT) {
      const idx = Math.floor(Math.random() * pool.length);
      winning.push(pool.splice(idx, 1)[0]);
    }

    const winningSet = new Set(winning);
    const hitCount = [...selected].filter((n) => winningSet.has(n)).length;

    setDrawn(winningSet);
    setHits(hitCount);

    for (let i = 1; i <= DRAW_COUNT; i++) {
      await new Promise((r) => setTimeout(r, 120));
      setRevealedCount(i);
    }

    const picks = selected.size;
    const multiplier = PAYOUTS[picks]?.[hitCount] ?? 0;
    const won = bet * multiplier;

    setGameState("result");
    setWinAmount(won);

    if (won > 0) await addBalance(won);
    logGame("keno", bet, won, multiplier);
  };

  const reset = () => {
    setSelected(new Set());
    setDrawn(new Set());
    setGameState("picking");
    setHits(0);
    setWinAmount(0);
    setRevealedCount(0);
  };

  const isDrawn = (n: number) => {
    if (gameState === "picking") return false;
    const sorted = [...drawn].sort((a, b) => a - b);
    const idx = sorted.indexOf(n);
    return idx >= 0 && idx < revealedCount;
  };

  if (kycStatus !== "approved") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">KYC Required</h2>
          <p className="text-slate-400 max-w-md mx-auto">Please complete identity verification to access Keno.</p>
        </div>
        <Link href="/kyc" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors">
          Verify Identity
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 py-8">
      <div className="w-full md:w-72 bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col gap-6 shrink-0 h-fit">
        <div className="flex flex-col">
          <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Bet Amount</label>
          <div className="flex items-center gap-4 bg-slate-950 rounded-xl p-2 border border-slate-800">
            <button
              onClick={() => setBet(Math.max(10, bet - 10))}
              disabled={gameState !== "picking"}
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-bold disabled:opacity-50"
            >-</button>
            <div className="flex-1 text-center">
              <span className="text-xl font-mono text-pink-400 font-bold">${bet}</span>
            </div>
            <button
              onClick={() => setBet(bet + 10)}
              disabled={gameState !== "picking"}
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-bold disabled:opacity-50"
            >+</button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Picks</span>
            <span className="font-bold text-white">{selected.size} / {MAX_PICKS}</span>
          </div>
          {gameState === "result" && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-400">Hits</span>
                <span className="font-bold text-emerald-400">{hits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payout</span>
                <span className="font-bold text-white">${winAmount.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {gameState === "result" ? (
          <button
            onClick={reset}
            className="w-full py-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xl uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-auto"
          >
            <RotateCcw className="w-5 h-5" /> Play Again
          </button>
        ) : (
          <button
            onClick={play}
            disabled={selected.size === 0 || balance < bet || gameState === "drawing"}
            className="w-full py-6 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(236,72,153,0.3)] disabled:shadow-none mt-auto"
          >
            {gameState === "drawing" ? "DRAWING..." : "PLAY"}
          </button>
        )}
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 sm:gap-2">
          {Array.from({ length: 80 }, (_, i) => i + 1).map((n) => {
            const picked = selected.has(n);
            const drawnNum = isDrawn(n);
            const isHit = picked && drawn.has(n) && drawnNum;

            return (
              <button
                key={n}
                onClick={() => toggleNumber(n)}
                disabled={gameState !== "picking"}
                className={cn(
                  "aspect-square rounded-lg font-bold text-sm sm:text-base transition-all",
                  gameState === "picking" && picked && "bg-pink-600 text-white ring-2 ring-pink-400",
                  gameState === "picking" && !picked && "bg-slate-800 hover:bg-slate-700 text-slate-300",
                  gameState !== "picking" && isHit && "bg-emerald-500 text-white ring-2 ring-emerald-300",
                  gameState !== "picking" && drawnNum && !picked && "bg-yellow-600/80 text-white",
                  gameState !== "picking" && !drawnNum && picked && "bg-pink-900/50 text-pink-300",
                  gameState !== "picking" && !drawnNum && !picked && "bg-slate-800/50 text-slate-600"
                )}
              >
                {drawnNum ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>{n}</motion.span>
                ) : n}
              </button>
            );
          })}
        </div>

        {gameState === "result" && (
          <div className={cn(
            "mt-6 text-center text-2xl font-black uppercase tracking-wider animate-in fade-in",
            winAmount > 0 ? "text-emerald-400" : "text-slate-500"
          )}>
            {winAmount > 0 ? `WON $${winAmount.toFixed(2)}!` : "NO WIN"}
          </div>
        )}
      </div>
    </div>
  );
}
