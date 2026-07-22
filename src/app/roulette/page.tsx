"use client";

import { useState } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, RotateCw } from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { motion } from "framer-motion";

type GameState = "idle" | "spinning" | "result";
type BetType = "color" | "number" | "evenodd" | "range";

export default function RoulettePage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();
  
  const [gameState, setGameState] = useState<GameState>("idle");
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState<BetType>("color");
  const [selectedBet, setSelectedBet] = useState<string | number>("red");
  const [resultNumber, setResultNumber] = useState<number>(0);
  const [winAmount, setWinAmount] = useState(0);
  const [rotation, setRotation] = useState(0);

  const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

  const getColor = (num: number) => {
    if (num === 0) return "green";
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? "red" : "black";
  };

  const calculateWinnings = (winNum: number) => {
    const color = getColor(winNum);
    
    if (betType === "color") {
      return selectedBet === color ? bet * 1.95 : 0;
    }
    if (betType === "number") {
      return selectedBet === winNum ? bet * 35 : 0;
    }
    if (betType === "evenodd") {
      if (winNum === 0) return 0;
      const isEven = winNum % 2 === 0;
      return (selectedBet === "even" && isEven) || (selectedBet === "odd" && !isEven) ? bet * 1.95 : 0;
    }
    if (betType === "range") {
      const isLow = winNum > 0 && winNum <= 18;
      const isHigh = winNum > 18;
      return (selectedBet === "low" && isLow) || (selectedBet === "high" && isHigh) ? bet * 1.95 : 0;
    }
    return 0;
  };

  const spin = async () => {
    if (gameState === "spinning" || balance < bet || selectedBet === null) return;
    if (!await deductBalance(bet)) return;

    setGameState("spinning");
    setWinAmount(0);

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

        const won = calculateWinnings(targetNum);
        const multiplier = won > 0 ? won / bet : 0;
        
        if (won > 0) {
          setWinAmount(won);
          await addBalance(won);
        }
        logGame('roulette', bet, won, multiplier);
    }, 4800);
  };

  const resetGame = () => {
    setGameState("idle");
    setWinAmount(0);
    setResultNumber(0);
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
    <div className="max-w-5xl mx-auto flex flex-col items-center gap-8 py-8 px-4">
      
      {/* Wheel Display */}
      <div className="w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          
          <div className="h-20 mb-4 flex items-center justify-center">
              {gameState === "result" && (
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                      "text-4xl font-black uppercase tracking-widest text-center",
                      winAmount > 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                      {winAmount > 0 ? `🎉 WON $${winAmount.toFixed(2)}!` : "❌ NO WIN"}
                  </motion.div>
              )}
          </div>

          {/* Roulette Wheel */}
          <div className="relative w-72 h-72 md:w-96 md:h-96 mb-8">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-5 z-30">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
              </div>
              
              <motion.div 
                  className="w-full h-full rounded-full border-8 border-slate-950 relative overflow-hidden bg-slate-900 shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_0_40px_rgba(0,0,0,0.9)]"
                  animate={{ rotate: rotation }}
                  transition={{ duration: 4.8, ease: "easeOut" }}
              >
                  {ROULETTE_NUMBERS.map((num, i) => {
                      const color = getColor(num);
                      const bgColor = color === "green" ? "bg-emerald-500" : color === "red" ? "bg-red-500" : "bg-slate-800";
                      return (
                          <div 
                              key={num}
                              className={`absolute top-0 left-1/2 origin-bottom ${bgColor} w-14 h-1/2 -translate-x-1/2 flex items-start justify-center pt-2 text-xs font-bold text-white drop-shadow-md`}
                              style={{ 
                                  transform: `translateX(-50%) rotate(${i * (360 / 37)}deg)`,
                                  clipPath: "polygon(50% 100%, 0 0, 100% 0)"
                              }}
                          >
                              <span>{num}</span>
                          </div>
                      );
                  })}
                  {/* Center Hub */}
                  <div className="absolute inset-0 m-auto w-16 h-16 bg-slate-800 rounded-full border-4 border-slate-950 z-10 flex items-center justify-center">
                    <div className="w-8 h-8 bg-slate-900 rounded-full" />
                  </div>
              </motion.div>
          </div>

          {/* Result Display */}
          {gameState === "result" && resultNumber !== null && (
              <div className="text-center">
                  <p className="text-slate-400 mb-2">Landed on:</p>
                  <p className={cn(
                      "text-5xl font-black",
                      getColor(resultNumber) === "red" ? "text-red-500" : getColor(resultNumber) === "green" ? "text-emerald-500" : "text-slate-300"
                  )}>{resultNumber}</p>
              </div>
          )}
      </div>

      {/* Betting Panel */}
      <div className="w-full max-w-2xl bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
          
          {/* Bet Type Selector */}
          <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-3">Bet Type</label>
              <div className="grid grid-cols-4 gap-2">
                  {(['color', 'number', 'evenodd', 'range'] as const).map(type => (
                      <button
                          key={type}
                          onClick={() => { setBetType(type); setSelectedBet(type === 'color' ? 'red' : type === 'evenodd' ? 'even' : type === 'range' ? 'low' : 1); }}
                          disabled={gameState === "spinning"}
                          className={cn(
                              "py-2 px-3 rounded-lg font-bold text-sm uppercase transition-all border-2",
                              betType === type ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                          )}
                      >
                          {type === 'color' ? 'Color' : type === 'number' ? 'Number' : type === 'evenodd' ? 'Even/Odd' : 'Range'}
                      </button>
                  ))}
              </div>
          </div>

          {/* Bet Amount */}
          <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-2">Bet Amount</label>
              <div className="flex items-center gap-2 bg-slate-950 rounded-xl p-2 border border-slate-800">
                  <button 
                      onClick={() => setBet(Math.max(10, bet - 10))}
                      disabled={gameState === "spinning"}
                      className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-lg font-bold transition-colors"
                  >−</button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-mono text-emerald-400 font-bold">${bet}</span>
                  </div>
                  <button 
                      onClick={() => setBet(bet + 10)}
                      disabled={gameState === "spinning"}
                      className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-lg font-bold transition-colors"
                  >+</button>
              </div>
          </div>

          {/* Bet Selection */}
          <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-3">Select Bet</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {betType === 'color' && (
                      <>
                          {[
                              { label: '🔴 Red', value: 'red', color: 'bg-red-500/20 border-red-500 text-red-400' },
                              { label: '⚫ Black', value: 'black', color: 'bg-slate-700 border-slate-500 text-white' },
                              { label: '🟢 Green', value: 'green', color: 'bg-emerald-500/20 border-emerald-500 text-emerald-400' },
                          ].map(btn => (
                              <button
                                  key={btn.value}
                                  onClick={() => setSelectedBet(btn.value)}
                                  disabled={gameState === "spinning"}
                                  className={cn(
                                      "py-3 rounded-lg font-bold uppercase transition-all border-2 disabled:opacity-50",
                                      selectedBet === btn.value ? btn.color : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                                  )}
                              >
                                  {btn.label}
                              </button>
                          ))}
                      </>
                  )}
                  {betType === 'number' && (
                      <>
                          {Array.from({ length: 37 }, (_, i) => (
                              <button
                                  key={i}
                                  onClick={() => setSelectedBet(i)}
                                  disabled={gameState === "spinning"}
                                  className={cn(
                                      "py-2 px-2 rounded-lg font-bold text-sm transition-all border-2 disabled:opacity-50",
                                      selectedBet === i ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                                  )}
                              >
                                  {i}
                              </button>
                          ))}
                      </>
                  )}
                  {betType === 'evenodd' && (
                      <>
                          {[
                              { label: 'Even', value: 'even' },
                              { label: 'Odd', value: 'odd' },
                          ].map(btn => (
                              <button
                                  key={btn.value}
                                  onClick={() => setSelectedBet(btn.value)}
                                  disabled={gameState === "spinning"}
                                  className={cn(
                                      "col-span-2 py-3 rounded-lg font-bold uppercase transition-all border-2 disabled:opacity-50",
                                      selectedBet === btn.value ? "bg-purple-500/20 border-purple-500 text-purple-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                                  )}
                              >
                                  {btn.label}
                              </button>
                          ))}
                      </>
                  )}
                  {betType === 'range' && (
                      <>
                          {[
                              { label: 'Low (1-18)', value: 'low' },
                              { label: 'High (19-36)', value: 'high' },
                          ].map(btn => (
                              <button
                                  key={btn.value}
                                  onClick={() => setSelectedBet(btn.value)}
                                  disabled={gameState === "spinning"}
                                  className={cn(
                                      "col-span-2 py-3 rounded-lg font-bold uppercase transition-all border-2 disabled:opacity-50",
                                      selectedBet === btn.value ? "bg-orange-500/20 border-orange-500 text-orange-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                                  )}
                              >
                                  {btn.label}
                              </button>
                          ))}
                      </>
                  )}
              </div>
          </div>

          {/* Spin Button */}
          <button
              onClick={spin}
              disabled={gameState === "spinning" || balance < bet}
              className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] disabled:shadow-none"
          >
              {gameState === "spinning" ? <RotateCw className="w-6 h-6 mx-auto animate-spin" /> : "SPIN WHEEL"}
          </button>

          {/* Reset Button (after result) */}
          {gameState === "result" && (
              <button
                  onClick={resetGame}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase transition-all"
              >
                  Play Again
              </button>
          )}
      </div>
    </div>
  );
}
