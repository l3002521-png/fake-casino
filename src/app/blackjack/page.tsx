"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  isHidden?: boolean;
}

type GameState = "betting" | "playing" | "dealerTurn" | "gameOver";
type GameResult = "win" | "loss" | "push" | "blackjack" | null;

const createDeck = (): Card[] => {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: { rank: Rank; value: number }[] = [
    { rank: "2", value: 2 }, { rank: "3", value: 3 }, { rank: "4", value: 4 },
    { rank: "5", value: 5 }, { rank: "6", value: 6 }, { rank: "7", value: 7 },
    { rank: "8", value: 8 }, { rank: "9", value: 9 }, { rank: "10", value: 10 },
    { rank: "J", value: 10 }, { rank: "Q", value: 10 }, { rank: "K", value: 10 },
    { rank: "A", value: 11 },
  ];

  let deck: Card[] = [];
  for (const suit of suits) {
    for (const { rank, value } of ranks) {
      deck.push({ suit, rank, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const calculateScore = (cards: Card[]): number => {
  let score = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.isHidden) continue;
    score += card.value;
    if (card.rank === "A") aces += 1;
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }

  return score;
};

const CardComponent = ({ card, className }: { card: Card; className?: string }) => {
  if (card.isHidden) {
    return (
      <div className={cn("w-20 h-28 sm:w-24 sm:h-36 bg-indigo-900 border-2 border-indigo-700 rounded-xl shadow-lg relative overflow-hidden", className)}>
        <div className="absolute inset-2 border border-indigo-500/30 rounded-lg bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(99,102,241,0.1)_10px,rgba(99,102,241,0.1)_20px)]" />
      </div>
    );
  }

  const isRed = card.suit === "hearts" || card.suit === "diamonds";
  const getSuitSymbol = (suit: Suit) => {
    switch (suit) {
      case "hearts": return "♥";
      case "diamonds": return "♦";
      case "clubs": return "♣";
      case "spades": return "♠";
    }
  };

  return (
    <div className={cn(
      "w-20 h-28 sm:w-24 sm:h-36 bg-white rounded-xl shadow-lg flex flex-col justify-between p-2 relative select-none",
      isRed ? "text-red-500" : "text-slate-900",
      className
    )}>
      <div className="text-lg sm:text-xl font-bold leading-none">{card.rank}</div>
      <div className="absolute inset-0 flex items-center justify-center opacity-20 text-5xl sm:text-6xl pointer-events-none">
        {getSuitSymbol(card.suit)}
      </div>
      <div className="text-lg sm:text-xl font-bold leading-none self-end rotate-180">{card.rank}</div>
    </div>
  );
};

export default function BlackjackPage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();
  
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [bet, setBet] = useState<number>(10);
  const [result, setResult] = useState<GameResult>(null);

  // Initial deal
  const deal = () => {
    if (!deductBalance(bet)) return;

    let currentDeck = deck;
    if (currentDeck.length < 10) {
      currentDeck = createDeck();
    }

    const pHand = [currentDeck.pop()!, currentDeck.pop()!];
    const dHand = [currentDeck.pop()!, { ...currentDeck.pop()!, isHidden: true }];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDeck(currentDeck);
    setGameState("playing");
    setResult(null);

    const pScore = calculateScore(pHand);
    if (pScore === 21) {
      handleGameOver(pHand, dHand, "blackjack");
    }
  };

  const hit = () => {
    const currentDeck = [...deck];
    const newCard = currentDeck.pop()!;
    const newHand = [...playerHand, newCard];
    
    setPlayerHand(newHand);
    setDeck(currentDeck);

    if (calculateScore(newHand) > 21) {
      handleGameOver(newHand, dealerHand, "loss");
    }
  };

  const stand = () => {
    setGameState("dealerTurn");
  };

  const handleGameOver = useCallback((pHand: Card[], dHand: Card[], forcedResult?: GameResult) => {
    setGameState("gameOver");
    
    // Reveal dealer's hidden card if it's not a direct player bust
    const revealedDealerHand = dHand.map(c => ({ ...c, isHidden: false }));
    setDealerHand(revealedDealerHand);

    let finalResult: GameResult = forcedResult || null;

    if (!finalResult) {
      const pScore = calculateScore(pHand);
      const dScore = calculateScore(revealedDealerHand);

      if (pScore > 21) finalResult = "loss";
      else if (dScore > 21) finalResult = "win";
      else if (pScore > dScore) finalResult = "win";
      else if (dScore > pScore) finalResult = "loss";
      else finalResult = "push";
    }

    setResult(finalResult);

    if (finalResult === "win") {
      addBalance(bet * 2);
      logGame('blackjack', bet, bet * 2, 2);
    } else if (finalResult === "blackjack") {
      addBalance(bet + (bet * 1.5));
      logGame('blackjack', bet, bet + (bet * 1.5), 2.5);
    } else if (finalResult === "push") {
      addBalance(bet);
      logGame('blackjack', bet, bet, 1);
    } else {
        logGame('blackjack', bet, 0, 0);
    }
  }, [bet, addBalance, logGame]);

  // Dealer logic effect
  useEffect(() => {
    if (gameState === "dealerTurn") {
      let isPlaying = true;
      const playDealer = async () => {
        let currentDHand: Card[] = dealerHand.map(c => ({ ...c, isHidden: false }));
        setDealerHand(currentDHand);
        
        let currentDeck = [...deck];

        // Simple delay for visual effect
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
        await delay(500);

        while (isPlaying && calculateScore(currentDHand) < 17) {
          const newCard = currentDeck.pop()!;
          currentDHand = [...currentDHand, newCard];
          setDealerHand(currentDHand);
          setDeck(currentDeck);
          await delay(800);
        }

        if (isPlaying) {
          handleGameOver(playerHand, currentDHand);
        }
      };

      playDealer();
      
      return () => {
        isPlaying = false;
      };
    }
  }, [gameState]); // Removed dealerHand, deck, playerHand, handleGameOver to prevent infinite loops

  const resetGame = () => {
    setGameState("betting");
    setPlayerHand([]);
    setDealerHand([]);
    setResult(null);
  };

  if (kycStatus === "none") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">KYC Required</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Please complete identity verification to access the tables. This ensures a secure playing environment.
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
    <div className="max-w-4xl mx-auto flex flex-col items-center gap-8 py-4">
      
      {/* Table Area */}
      <div className="w-full bg-emerald-950/40 border border-emerald-900/50 rounded-[3rem] p-8 min-h-[600px] flex flex-col justify-between relative shadow-2xl shadow-emerald-900/20">
        
        {/* Dealer Side */}
        <div className="flex flex-col items-center gap-4 min-h-[200px]">
          <div className="text-emerald-500 font-mono text-sm uppercase tracking-widest flex items-center gap-2">
            Dealer 
            {gameState !== "betting" && gameState !== "playing" && (
              <span className="bg-emerald-900/50 px-2 py-0.5 rounded text-emerald-300">
                {calculateScore(dealerHand)}
              </span>
            )}
          </div>
          <div className="flex justify-center gap-[-2rem] sm:gap-[-3rem]">
            {dealerHand.map((card, i) => (
              <div key={i} className="transition-all duration-300" style={{ transform: `translateX(${-i * 20}px)` }}>
                 <CardComponent card={card} />
              </div>
            ))}
          </div>
        </div>

        {/* Center / Messages */}
        <div className="flex-grow flex items-center justify-center">
          {gameState === "betting" && (
            <div className="flex flex-col items-center gap-4 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm z-10">
              <h3 className="text-xl font-bold text-slate-200">Place Your Bet</h3>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setBet(Math.max(10, bet - 10))}
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-bold"
                >-</button>
                <div className="text-3xl font-mono text-emerald-400 w-24 text-center">
                  ${bet}
                </div>
                <button 
                  onClick={() => setBet(bet + 10)}
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-bold"
                >+</button>
              </div>
              <button 
                onClick={deal}
                disabled={balance < bet}
                className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deal Cards
              </button>
            </div>
          )}

          {gameState === "gameOver" && (
            <div className="flex flex-col items-center gap-4 bg-slate-950/90 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm z-10 animate-in fade-in zoom-in duration-300">
              <h3 className={cn(
                "text-4xl font-black uppercase tracking-wider",
                result === "win" || result === "blackjack" ? "text-emerald-400" : 
                result === "loss" ? "text-red-500" : "text-amber-400"
              )}>
                {result === "blackjack" ? "Blackjack!" : 
                 result === "win" ? "You Win!" : 
                 result === "loss" ? "Dealer Wins" : "Push"}
              </h3>
              
              <button 
                onClick={resetGame}
                className="mt-4 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
              </button>
            </div>
          )}
        </div>

        {/* Player Side */}
        <div className="flex flex-col items-center gap-4 min-h-[200px]">
          <div className="flex justify-center">
             {playerHand.map((card, i) => (
              <div key={i} className="transition-all duration-300" style={{ transform: `translateX(${-i * 20}px)` }}>
                 <CardComponent card={card} />
              </div>
            ))}
          </div>
          <div className="text-emerald-500 font-mono text-sm uppercase tracking-widest flex items-center gap-2">
            Player
            {playerHand.length > 0 && (
              <span className={cn(
                "px-2 py-0.5 rounded",
                calculateScore(playerHand) > 21 ? "bg-red-900/50 text-red-400" : "bg-emerald-900/50 text-emerald-300"
              )}>
                {calculateScore(playerHand)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={hit}
          disabled={gameState !== "playing"}
          className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 rounded-xl font-bold transition-all border border-slate-700 disabled:border-slate-800 text-lg"
        >
          HIT
        </button>
        <button
          onClick={stand}
          disabled={gameState !== "playing"}
          className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 rounded-xl font-bold transition-all border border-slate-700 disabled:border-slate-800 text-lg"
        >
          STAND
        </button>
      </div>

    </div>
  );
}
