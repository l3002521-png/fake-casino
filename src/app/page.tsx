"use client";

import Link from "next/link";
import { Spade, Dices, Rocket, Coins, Target, Bomb, Pyramid, ArrowDownUp, Hexagon, Shapes, Gamepad2, Club, Play } from "lucide-react";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";

const GAMES = [
    { 
        title: "Blackjack", 
        href: "/blackjack", 
        icon: Spade, 
        bgClass: "bg-emerald-500", 
        textClass: "text-emerald-400", 
        borderClass: "hover:border-emerald-500/50",
        glowClass: "hover:shadow-[0_0_40px_rgba(52,211,153,0.3)]",
        pattern: "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.1) 0%, transparent 70%)"
    },
    { 
        title: "Slots", 
        href: "/slots", 
        icon: Dices, 
        bgClass: "bg-fuchsia-500", 
        textClass: "text-fuchsia-400", 
        borderClass: "hover:border-fuchsia-500/50",
        glowClass: "hover:shadow-[0_0_40px_rgba(217,70,239,0.3)]",
        pattern: "radial-gradient(circle at 50% 50%, rgba(217,70,239,0.1) 0%, transparent 70%)"
    },
    { 
        title: "Crash", 
        href: "/crash", 
        icon: Rocket, 
        bgClass: "bg-blue-500", 
        textClass: "text-blue-400", 
        borderClass: "hover:border-blue-500/50",
        glowClass: "hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]",
        pattern: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.1) 0%, transparent 70%)"
    },
    { 
        title: "Coin Flip", 
        href: "/coinflip", 
        icon: Coins, 
        bgClass: "bg-amber-500", 
        textClass: "text-amber-400", 
        borderClass: "hover:border-amber-500/50",
        glowClass: "hover:shadow-[0_0_40px_rgba(245,158,11,0.3)]",
        pattern: "radial-gradient(circle at 50% 50%, rgba(245,158,11,0.1) 0%, transparent 70%)"
    },
    { 
        title: "Chicken Run",
        href: "/roulette",
        icon: Target, 
        bgClass: "bg-red-500", 
        textClass: "text-red-400", 
        borderClass: "hover:border-red-500/50",
        glowClass: "hover:shadow-[0_0_40px_rgba(239,68,68,0.3)]",
        pattern: "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.1) 0%, transparent 70%)"
    },
    { 
        title: "Mines", 
        href: "/mines", 
        icon: Bomb, 
        bgClass: "bg-teal-500", 
        textClass: "text-teal-400", 
        borderClass: "hover:border-teal-500/50",
        glowClass: "hover:shadow-[0_0_40px_rgba(20,184,166,0.3)]",
        pattern: "radial-gradient(circle at 50% 50%, rgba(20,184,166,0.1) 0%, transparent 70%)"
    },
    { 
        title: "Plinko", 
        href: "/plinko", 
        icon: Pyramid, 
        bgClass: "bg-purple-500", 
        textClass: "text-purple-400", 
        borderClass: "hover:border-purple-500/50",
        glowClass: "hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]",
        pattern: "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.1) 0%, transparent 70%)"
    },
    { 
        title: "HiLo", 
        href: "/hilo", 
        icon: ArrowDownUp, 
        bgClass: "bg-cyan-500", 
        textClass: "text-cyan-400", 
        borderClass: "hover:border-cyan-500/50",
        glowClass: "hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]",
        pattern: "radial-gradient(circle at 50% 50%, rgba(6,182,212,0.1) 0%, transparent 70%)"
    },
    { 
        title: "Dice", 
        href: "/dice", 
        icon: Hexagon, 
        bgClass: "bg-indigo-500", 
        textClass: "text-indigo-400", 
        borderClass: "hover:border-indigo-500/50",
        glowClass: "hover:shadow-[0_0_40px_rgba(99,102,241,0.3)]",
        pattern: "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)"
    },
    { 
        title: "Baccarat", 
        href: "/baccarat", 
        icon: Club, 
        bgClass: "bg-yellow-500", 
        textClass: "text-yellow-400", 
        borderClass: "hover:border-yellow-500/50",
        glowClass: "hover:shadow-[0_0_40px_rgba(234,179,8,0.3)]",
        pattern: "radial-gradient(circle at 50% 50%, rgba(234,179,8,0.1) 0%, transparent 70%)"
    },
    { 
        title: "Keno", 
        href: "/keno", 
        icon: Shapes, 
        bgClass: "bg-pink-500", 
        textClass: "text-pink-400", 
        borderClass: "hover:border-pink-500/50",
        glowClass: "hover:shadow-[0_0_40px_rgba(236,72,153,0.3)]",
        pattern: "radial-gradient(circle at 50% 50%, rgba(236,72,153,0.1) 0%, transparent 70%)"
    },
    { 
        title: "Video Poker", 
        href: "/video-poker", 
        icon: Gamepad2, 
        bgClass: "bg-orange-500", 
        textClass: "text-orange-400", 
        borderClass: "hover:border-orange-500/50",
        glowClass: "hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]",
        pattern: "radial-gradient(circle at 50% 50%, rgba(249,115,22,0.1) 0%, transparent 70%)"
    },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center pb-24">
      
      {/* Hero Section */}
      <div className="relative w-full max-w-7xl mx-auto mt-8 mb-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-fuchsia-500/20 blur-[100px] rounded-[100px] -z-10 pointer-events-none" />
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-8 md:p-16 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md overflow-hidden relative">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex-1 space-y-6 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Prototype
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-tight">
                    Next-Gen <br className="hidden md:block"/> Crypto Casino
                </h1>
                <p className="text-xl text-slate-400 max-w-xl font-medium">
                    Provably fair games. Instant prototype deposits. Secure KYC verification. Experience the future of gaming.
                </p>
                <div className="pt-4">
                    <Link href="/slots" className="inline-flex items-center gap-2 bg-white hover:bg-slate-200 text-slate-900 px-8 py-4 rounded-xl font-black text-lg transition-transform hover:scale-105 active:scale-95">
                        <Play className="w-5 h-5 fill-current" /> Play Now
                    </Link>
                </div>
            </div>

            {/* Abstract Hero Graphic */}
            <div className="hidden lg:flex w-80 h-80 relative z-10 items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-3xl rotate-12 opacity-20 blur-xl animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-3xl -rotate-6 opacity-40 blur-lg" />
                <div className="relative w-64 h-64 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at center, #34d399 2px, transparent 2px)", backgroundSize: "20px 20px" }} />
                    <Dices className="w-32 h-32 text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]" />
                </div>
            </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="w-full max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                  <Spade className="w-8 h-8 text-emerald-500" /> Casino Games
              </h2>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6"
          >
              {GAMES.map((game) => (
                  <motion.div key={game.href} variants={itemVariants}>
                      <Link 
                          href={game.href}
                          className={cn(
                              "relative group block aspect-[3/4] rounded-2xl bg-slate-900 border-2 border-slate-800/80 transition-all duration-300 overflow-hidden",
                              game.borderClass,
                              game.glowClass
                          )}
                      >
                          {/* Inner abstract background */}
                          <div 
                              className="absolute inset-0 opacity-40 group-hover:opacity-100 transition-opacity duration-500"
                              style={{ background: game.pattern }}
                          />
                          
                          {/* Glow orb */}
                          <div className={cn(
                              "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-0 group-hover:opacity-40 transition-opacity duration-500", 
                              game.bgClass
                          )} />

                          {/* Massive Icon */}
                          <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-4">
                              <game.icon className={cn(
                                  "w-24 h-24 opacity-20 group-hover:opacity-100 transition-opacity duration-500 drop-shadow-2xl",
                                  game.textClass
                              )} />
                          </div>

                          {/* Text Area */}
                          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent">
                              <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                  <div className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300", game.textClass)}>
                                      Originals
                                  </div>
                                  <h3 className="text-xl font-black text-white drop-shadow-md">{game.title}</h3>
                              </div>
                          </div>
                      </Link>
                  </motion.div>
              ))}
          </motion.div>
      </div>

    </div>
  );
}