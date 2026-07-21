"use client";

import { useState } from "react";
import { useAppContext } from "@/app/AppContext";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type BetSide = "player" | "banker" | "tie";
type GameState = "betting" | "dealing" | "result";

interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

const createDeck = (): Card[] => {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: { rank: Rank; value: number }[] = [
    { rank: "A", value: 1 }, { rank: "2", value: 2 }, { rank: "3", value: 3 },
    { rank: "4", value: 4 }, { rank: "5", value: 5 }, { rank: "6", value: 6 },
    { rank: "7", value: 7 }, { rank: "8", value: 8 }, { rank: "9", value: 9 },
    { rank: "10", value: 0 }, { rank: "J", value: 0 }, { rank: "Q", value: 0 }, { rank: "K", value: 0 },
  ];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const { rank, value } of ranks) {
      deck.push({ suit, rank, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const handScore = (cards: Card[]): number =>
  cards.reduce((sum, c) => sum + c.value, 0) % 10;

const playerDrawsThird = (playerScore: number, playerThird?: Card): boolean => {
  if (playerScore >= 8) return false;
  if (playerScore <= 5) return true;
  return false;
};

const bankerDrawsThird = (bankerScore: number, playerThird?: Card): boolean => {
  if (bankerScore >= 8) return false;
  if (bankerScore <= 2) return true;
  if (!playerThird) return bankerScore <= 5;

  const p3 = playerThird.value;
  if (bankerScore === 3) return p3 !== 8;
  if (bankerScore === 4) return p3 >= 2 && p3 <= 7;
  if (bankerScore === 5) return p3 >= 4 && p3 <= 7;
  if (bankerScore === 6) return p3 === 6 || p3 === 7;
  return false;
};

const CardComponent = ({ card }: { card: Card }) => {
  const isRed = card.suit === "hearts" || card.suit === "diamonds";
  const suitSymbol = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }[card.suit];

  return (
    <div className={cn(
      "w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-xl shadow-lg flex flex-col justify-between p-2 relative select-none",
      isRed ? "text-red-500" : "text-slate-900"
    )}>
      <div className="text-base sm:text-lg font-bold leading-none">{card.rank}</div>
      <div className="absolute inset-0 flex items-center justify-center opacity-20 text-4xl sm:text-5xl pointer-events-none">
        {suitSymbol}
      </div>
      <div className="text-base sm:text-lg font-bold leading-none self-end rotate-180">{card.rank}</div>
    </div>
  );
};

export default function BaccaratPage() {
  const { balance, kycStatus, deductBalance, addBalance, logGame } = useAppContext();

  const [bet, setBet] = useState(10);
  const [betSide, setBetSide] = useState<BetSide>("player");
  const [gameState, setGameState] = useState<GameState>("betting");
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [bankerHand, setBankerHand] = useState<Card[]>([]);
  const [result, setResult] = useState<"player" | "banker" | "tie" | null>(null);
  const [winAmount, setWinAmount] = useState(0);

  const deal = async () => {
    if (balance < bet || gameState === "dealing") return;
    if (!await deductBalance(bet)) return;

    setGameState("dealing");
    setWinAmount(0);
    setResult(null);

    setTimeout(async () => {
      const deck = createDeck();
      let player = [deck.pop()!, deck.pop()!];
      let banker = [deck.pop()!, deck.pop()!];

      let pScore = handScore(player);
      let bScore = handScore(banker);
      let playerThird: Card | undefined;

      if (pScore < 8 && bScore < 8) {
        if (playerDrawsThird(pScore)) {
          playerThird = deck.pop()!;
          player = [...player, playerThird];
          pScore = handScore(player);
        }
        if (bankerDrawsThird(bScore, playerThird)) {
          banker = [...banker, deck.pop()!];
          bScore = handScore(banker);
        }
      }

      setPlayerHand(player);
      setBankerHand(banker);

      let winner: "player" | "banker" | "tie";
      if (pScore > bScore) winner = "player";
      else if (bScore > pScore) winner = "banker";
      else winner = "tie";

      setResult(winner);
      setGameState("result");

      let won = 0;
      let multiplier = 0;

      if (betSide === winner) {
        if (winner === "player") {
          multiplier = 2;
          won = bet * 2;
        } else if (winner === "banker") {
          multiplier = 1.95;
          won = bet * 1.95;
        } else {
          multiplier = 9;
          won = bet * 9;
        }
        setWinAmount(won);
        await addBalance(won);
      }

      logGame("baccarat", bet, won, multiplier);
    }, 800);
  };

  const reset = () => {
    setGameState("betting");
    setPlayerHand([]);
    setBankerHand([]);
    setResult(null);
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
          <p className="text-slate-400 max-w-md mx-auto">Please complete identity verification to access Baccarat.</p>
        </div>
        <Link href="/kyc" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors">
          Verify Identity
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 py-8">
      <div className="w-full md:w-80 bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col gap-6 shrink-0 h-fit">
        <div className="flex flex-col">
          <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Bet Amount</label>
          <div className="flex items-center gap-4 bg-slate-950 rounded-xl p-2 border border-slate-800">
            <button
              onClick={() => setBet(Math.max(10, bet - 10))}
              disabled={gameState === "dealing"}
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-bold disabled:opacity-50"
            >-</button>
            <div className="flex-1 text-center">
              <span className="text-xl font-mono text-yellow-400 font-bold">${bet}</span>
            </div>
            <button
              onClick={() => setBet(bet + 10)}
              disabled={gameState === "dealing"}
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-bold disabled:opacity-50"
            >+</button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Bet On</label>
          {(["player", "banker", "tie"] as BetSide[]).map((side) => (
            <button
              key={side}
              onClick={() => setBetSide(side)}
              disabled={gameState === "dealing"}
              className={cn(
                "py-3 rounded-xl font-bold uppercase tracking-wider transition-all border-2",
                betSide === side
                  ? side === "player" ? "bg-blue-500/20 border-blue-500 text-blue-400"
                    : side === "banker" ? "bg-red-500/20 border-red-500 text-red-400"
                    : "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
              )}
            >
              {side} {side === "player" ? "(1:1)" : side === "banker" ? "(0.95:1)" : "(8:1)"}
            </button>
          ))}
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
            onClick={deal}
            disabled={balance < bet || gameState === "dealing"}
            className="w-full py-6 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(234,179,8,0.3)] disabled:shadow-none mt-auto"
          >
            {gameState === "dealing" ? "DEALING..." : "DEAL"}
          </button>
        )}
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col gap-8 min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="text-red-400 font-mono text-sm uppercase tracking-widest flex items-center gap-2">
            Banker
            {bankerHand.length > 0 && (
              <span className="bg-red-900/50 px-2 py-0.5 rounded text-red-300">{handScore(bankerHand)}</span>
            )}
          </div>
          <div className="flex justify-center gap-2">
            {bankerHand.map((card, i) => <CardComponent key={i} card={card} />)}
            {bankerHand.length === 0 && gameState === "betting" && (
              <div className="text-slate-600 text-sm">Place your bet and deal</div>
            )}
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center">
          {gameState === "result" && result && (
            <div className="text-center animate-in fade-in zoom-in duration-300">
              <div className={cn(
                "text-3xl font-black uppercase tracking-wider mb-2",
                betSide === result ? "text-emerald-400" : "text-red-500"
              )}>
                {result.toUpperCase()} WINS
              </div>
              <div className="text-lg text-slate-400">
                {betSide === result ? `You won $${winAmount.toFixed(2)}!` : "Better luck next time"}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center gap-2">
            {playerHand.map((card, i) => <CardComponent key={i} card={card} />)}
          </div>
          <div className="text-blue-400 font-mono text-sm uppercase tracking-widest flex items-center gap-2">
            Player
            {playerHand.length > 0 && (
              <span className="bg-blue-900/50 px-2 py-0.5 rounded text-blue-300">{handScore(playerHand)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
