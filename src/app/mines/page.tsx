"use client";

import { useState, useCallback } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, Bomb, Diamond, Skull } from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { motion } from "framer-motion";

type CellState = "hidden" | "gem" | "bomb";
type GameState = "idle" | "playing" | "cashedOut" | "busted";

export default function MinesPage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();
  
  const [gameState, setGameState] = useState<GameState>("idle");
  const [bet, setBet] = useState(10);
  const [minesCount, setMinesCount] = useState(3);
  
  const [grid, setGrid] = useState<CellState[]>(Array(25).fill("hidden"));
  const [mineLocations, setMineLocations] = useState<Set<number>>(new Set());
  const [gemsRevealed, setGemsRevealed] = useState(0);

  // Math for multipliers — starts at 0.5x, first gem never profitable
  const calculateMultiplier = (revealed: number, mines: number) => {
      if (revealed === 0) return 0.5;
      const total = 25;
      let prob = 1;
      for (let i = 0; i < revealed; i++) {
          prob *= (total - mines - i) / (total - i);
      }
      const fairMult = 1 / prob;
      const oneGemFair = (total - mines) / total;
      const oneGemMult = 0.88 * (1 / oneGemFair);
      const scale = 0.5 / oneGemMult;
      return 0.88 * fairMult * scale;
  };

  const currentMultiplier = calculateMultiplier(gemsRevealed, minesCount);
  const nextMultiplier = calculateMultiplier(gemsRevealed + 1, minesCount);

  const startGame = async () => {
    if (balance < bet) return;
    if (!await deductBalance(bet)) return;

    setGameState("playing");
    setGrid(Array(25).fill("hidden"));
    setGemsRevealed(0);

    // Plant mines
    const newMines = new Set<number>();
    while (newMines.size < minesCount) {
        newMines.add(Math.floor(Math.random() * 25));
    }
    setMineLocations(newMines);
  };

  const handleCellClick = (index: number) => {
      if (gameState !== "playing" || grid[index] !== "hidden") return;

      const newGrid = [...grid];
      
      if (mineLocations.has(index)) {
          // BUST! Reveal all
          newGrid.forEach((_, i) => {
              newGrid[i] = mineLocations.has(i) ? "bomb" : "gem";
          });
          setGrid(newGrid);
          setGameState("busted");
          logGame('mines', bet, 0, 0);
      } else {
          // SAFE
          newGrid[index] = "gem";
          setGrid(newGrid);
          setGemsRevealed(prev => prev + 1);
      }
  };

  const cashOut = async () => {
      if (gameState !== "playing" || gemsRevealed === 0) return;

      setGameState("cashedOut");
      const won = bet * currentMultiplier;
      await addBalance(won);
      logGame('mines', bet, won, currentMultiplier);

      // Reveal rest of the grid
      const newGrid = [...grid];
      newGrid.forEach((cell, i) => {
          if (cell === "hidden") {
             newGrid[i] = mineLocations.has(i) ? "bomb" : "gem";
          }
      });
      setGrid(newGrid);
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
            Please complete identity verification to access Mines.
          </p>
        </div>
        <Link href="/kyc" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors">
          Verify Identity
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 py-8">
      
      {/* Controls Area */}
      <div className="w-full md:w-80 bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col gap-6 shrink-0 h-fit">
          <div className="flex flex-col">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Bet Amount</label>
              <div className="flex items-center gap-4 bg-slate-950 rounded-xl p-2 border border-slate-800">
                  <button 
                      onClick={() => setBet(Math.max(10, bet - 10))}
                      disabled={gameState === "playing"}
                      className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-xl font-bold transition-colors"
                  >-</button>
                  <div className="flex-1 text-center">
                    <span className="text-xl font-mono text-emerald-400 font-bold">${bet}</span>
                  </div>
                  <button 
                      onClick={() => setBet(bet + 10)}
                      disabled={gameState === "playing"}
                      className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-xl font-bold transition-colors"
                  >+</button>
              </div>
          </div>

          <div className="flex flex-col">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Mines</label>
              <select 
                  value={minesCount} 
                  onChange={(e) => setMinesCount(Number(e.target.value))}
                  disabled={gameState === "playing"}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold focus:outline-none focus:border-emerald-500 appearance-none disabled:opacity-50"
              >
                  {[...Array(24)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                  ))}
              </select>
          </div>

          {gameState === "playing" ? (
              <button
                  onClick={cashOut}
                  disabled={gemsRevealed === 0}
                  className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] disabled:shadow-none flex flex-col items-center gap-1 mt-auto"
              >
                  <span>CASH OUT</span>
                  {gemsRevealed > 0 && (
                      <span className="text-sm font-mono bg-black/20 px-3 py-1 rounded-full">
                          ${(bet * currentMultiplier).toFixed(2)}
                      </span>
                  )}
              </button>
          ) : (
              <button
                  onClick={startGame}
                  disabled={balance < bet}
                  className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] disabled:shadow-none mt-auto"
              >
                  BET
              </button>
          )}
      </div>

      {/* Game Grid */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center justify-center min-h-[500px]">
          
          <div className="h-12 w-full flex justify-between items-center mb-6">
              <div className="text-slate-400 font-bold flex gap-4">
                  <span className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                    Mult: <span className="text-white">{currentMultiplier.toFixed(2)}x</span>
                  </span>
                  <span className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 hidden sm:inline">
                    Next: <span className="text-emerald-400">{nextMultiplier.toFixed(2)}x</span>
                  </span>
              </div>
              {gameState === "cashedOut" && (
                  <div className={cn(
                      "text-xl font-black animate-in fade-in slide-in-from-top-4",
                      currentMultiplier >= 1 ? "text-emerald-400" : "text-amber-400"
                  )}>
                      {currentMultiplier >= 1 ? "+" : ""}${(bet * currentMultiplier).toFixed(2)}
                      {currentMultiplier < 1 && (
                          <span className="text-sm text-slate-400 ml-2">({((currentMultiplier - 1) * bet).toFixed(2)} net)</span>
                      )}
                  </div>
              )}
              {gameState === "busted" && (
                  <div className="text-xl font-black text-red-500 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
                      <Skull className="w-5 h-5" /> BUSTED
                  </div>
              )}
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3 w-full max-w-lg aspect-square">
              {grid.map((cell, i) => (
                  <button
                      key={i}
                      onClick={() => handleCellClick(i)}
                      disabled={gameState !== "playing" || cell !== "hidden"}
                      className={cn(
                          "rounded-lg sm:rounded-xl relative transition-all duration-300 [transform-style:preserve-3d]",
                          cell === "hidden" 
                              ? "bg-slate-800 hover:bg-slate-700 hover:-translate-y-1 shadow-[0_4px_0_rgb(30,41,59)] hover:shadow-[0_6px_0_rgb(30,41,59)] cursor-pointer" 
                              : "bg-slate-950 shadow-inner"
                      )}
                  >
                      {/* Hidden State */}
                      <div className={cn(
                          "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                          cell !== "hidden" ? "opacity-0" : "opacity-100"
                      )} />
                      
                      {/* Revealed State */}
                      <div className={cn(
                          "absolute inset-0 flex items-center justify-center transition-all duration-300 transform",
                          cell === "hidden" ? "opacity-0 scale-50 rotate-y-180" : "opacity-100 scale-100 rotate-y-0"
                      )}>
                          {cell === "gem" && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                  <Diamond className={cn("w-8 h-8 sm:w-10 sm:h-10", 
                                      gameState === "playing" ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "text-emerald-900 opacity-50"
                                  )} />
                              </motion.div>
                          )}
                          {cell === "bomb" && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                  <Bomb className={cn("w-8 h-8 sm:w-10 sm:h-10",
                                      gameState === "busted" && mineLocations.has(i) ? "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" : "text-slate-500"
                                  )} />
                              </motion.div>
                          )}
                      </div>
                  </button>
              ))}
          </div>
      </div>

    </div>
  );
}
