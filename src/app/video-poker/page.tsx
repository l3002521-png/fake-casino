"use client";

import { useState } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type GameState = "betting" | "dealt" | "result";

interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

const RANK_ORDER: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const PAYOUTS: Record<string, number> = {
  "Royal Flush": 250,
  "Straight Flush": 50,
  "Four of a Kind": 25,
  "Full House": 9,
  "Flush": 6,
  "Straight": 4,
  "Three of a Kind": 3,
  "Two Pair": 2,
  "Jacks or Better": 1,
};

const createDeck = (): Card[] => {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: { rank: Rank; value: number }[] = [
    { rank: "2", value: 2 }, { rank: "3", value: 3 }, { rank: "4", value: 4 },
    { rank: "5", value: 5 }, { rank: "6", value: 6 }, { rank: "7", value: 7 },
    { rank: "8", value: 8 }, { rank: "9", value: 9 }, { rank: "10", value: 10 },
    { rank: "J", value: 11 }, { rank: "Q", value: 12 }, { rank: "K", value: 13 }, { rank: "A", value: 14 },
  ];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const { rank, value } of ranks) {
      deck.push({ suit, rank, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const evaluateHand = (cards: Card[]): string | null => {
  const ranks = cards.map((c) => c.rank);
  const values = cards.map((c) => c.value).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  const rankCounts: Record<string, number> = {};
  for (const r of ranks) rankCounts[r] = (rankCounts[r] || 0) + 1;
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  const isStraight = (() => {
    const indices = ranks.map((r) => RANK_ORDER.indexOf(r)).sort((a, b) => a - b);
    if (indices[4] - indices[0] === 4 && new Set(indices).size === 5) return true;
    // A-2-3-4-5 wheel
    if (indices.join() === "0,1,2,3,12") return true;
    return false;
  })();

  const isRoyal = isFlush && isStraight && values.includes(14) && values.includes(13);

  if (isRoyal) return "Royal Flush";
  if (isFlush && isStraight) return "Straight Flush";
  if (counts[0] === 4) return "Four of a Kind";
  if (counts[0] === 3 && counts[1] === 2) return "Full House";
  if (isFlush) return "Flush";
  if (isStraight) return "Straight";
  if (counts[0] === 3) return "Three of a Kind";
  if (counts[0] === 2 && counts[1] === 2) return "Two Pair";

  const pairs = Object.entries(rankCounts).filter(([, c]) => c === 2);
  if (pairs.length === 1) {
    const pairRank = pairs[0][0];
    const pairValue = RANK_ORDER.indexOf(pairRank as Rank);
    if (pairValue >= RANK_ORDER.indexOf("J")) return "Jacks or Better";
  }

  return null;
};

const CardComponent = ({
  card,
  held,
  onToggle,
  disabled,
}: {
  card: Card;
  held: boolean;
  onToggle: () => void;
  disabled: boolean;
}) => {
  const isRed = card.suit === "hearts" || card.suit === "diamonds";
  const suitSymbol = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }[card.suit];

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-xl shadow-lg flex flex-col justify-between p-2 select-none transition-all",
        isRed ? "text-red-500" : "text-slate-900",
        held && "ring-4 ring-orange-400 -translate-y-2",
        !disabled && "hover:-translate-y-1 cursor-pointer"
      )}
    >
      {held && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
          Hold
        </div>
      )}
      <div className="text-base sm:text-lg font-bold leading-none">{card.rank}</div>
      <div className="absolute inset-0 flex items-center justify-center opacity-20 text-4xl sm:text-5xl pointer-events-none">
        {suitSymbol}
      </div>
      <div className="text-base sm:text-lg font-bold leading-none self-end rotate-180">{card.rank}</div>
    </button>
  );
};

export default function VideoPokerPage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();

  const [bet, setBet] = useState(10);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [deck, setDeck] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [handName, setHandName] = useState<string | null>(null);
  const [winAmount, setWinAmount] = useState(0);

  const deal = async () => {
    if (balance < bet) return;
    if (!await deductBalance(bet)) return;

    const newDeck = createDeck();
    const dealt = [newDeck.pop()!, newDeck.pop()!, newDeck.pop()!, newDeck.pop()!, newDeck.pop()!];

    setDeck(newDeck);
    setHand(dealt);
    setHeld([false, false, false, false, false]);
    setHandName(null);
    setWinAmount(0);
    setGameState("dealt");
  };

  const toggleHold = (index: number) => {
    if (gameState !== "dealt") return;
    setHeld((prev) => prev.map((h, i) => (i === index ? !h : h)));
  };

  const draw = async () => {
    if (gameState !== "dealt") return;

    const newDeck = [...deck];
    const newHand = hand.map((card, i) => (held[i] ? card : newDeck.pop()!));

    setDeck(newDeck);
    setHand(newHand);
    setGameState("result");

    const result = evaluateHand(newHand);
    setHandName(result);

    const multiplier = result ? (PAYOUTS[result] ?? 0) : 0;
    const won = bet * multiplier;
    setWinAmount(won);

    if (won > 0) await addBalance(won);
    logGame("video-poker", bet, won, multiplier);
  };

  const reset = () => {
    setGameState("betting");
    setHand([]);
    setHeld([false, false, false, false, false]);
    setHandName(null);
    setWinAmount(0);
  };

  if (kycStatus !== "approved") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">KYC Required</h2>
          <p className="text-slate-400 max-w-md mx-auto">Please complete identity verification to access Video Poker.</p>
        </div>
        <Link href="/kyc" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors">
          Verify Identity
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 py-8">
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="flex justify-center gap-2 sm:gap-4 min-h-[140px] items-end mb-8">
          {hand.length > 0 ? (
            hand.map((card, i) => (
              <CardComponent
                key={i}
                card={card}
                held={held[i]}
                onToggle={() => toggleHold(i)}
                disabled={gameState !== "dealt"}
              />
            ))
          ) : (
            <div className="text-slate-600 text-center py-12">Place your bet and deal to start</div>
          )}
        </div>

        {gameState === "result" && (
          <div className="text-center mb-6 animate-in fade-in">
            <div className={cn(
              "text-2xl font-black uppercase tracking-wider",
              winAmount > 0 ? "text-emerald-400" : "text-slate-500"
            )}>
              {handName ?? "No Win"}
            </div>
            {winAmount > 0 && (
              <div className="text-lg text-emerald-300 mt-1">+${winAmount.toFixed(2)}</div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs sm:text-sm">
          {Object.entries(PAYOUTS).map(([name, mult]) => (
            <div
              key={name}
              className={cn(
                "px-2 py-1.5 rounded-lg border text-center",
                handName === name
                  ? "bg-orange-500/20 border-orange-500 text-orange-300"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              )}
            >
              <div className="font-bold truncate">{name}</div>
              <div className="text-white">{mult}x</div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md mx-auto bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
        <div className="flex flex-col">
          <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Bet Amount</label>
          <div className="flex items-center gap-4 bg-slate-950 rounded-xl p-2 border border-slate-800">
            <button
              onClick={() => setBet(Math.max(10, bet - 10))}
              disabled={gameState !== "betting"}
              className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-2xl font-bold"
            >-</button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-mono text-orange-400 font-bold">${bet}</span>
            </div>
            <button
              onClick={() => setBet(bet + 10)}
              disabled={gameState !== "betting"}
              className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center text-2xl font-bold"
            >+</button>
          </div>
        </div>

        {gameState === "result" ? (
          <button
            onClick={reset}
            className="w-full py-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xl uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" /> Play Again
          </button>
        ) : gameState === "dealt" ? (
          <button
            onClick={draw}
            className="w-full py-6 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)]"
          >
            DRAW
          </button>
        ) : (
          <button
            onClick={deal}
            disabled={balance < bet}
            className="w-full py-6 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)] disabled:shadow-none"
          >
            DEAL
          </button>
        )}
      </div>
    </div>
  );
}
