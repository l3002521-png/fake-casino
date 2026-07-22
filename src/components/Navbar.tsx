"use client";

import Link from "next/link";
import { useAppContext } from "@/app/AppContext";
import { Wallet, ShieldCheck, ShieldAlert, Shield, LogOut, User, Lock, KeyRound, Gift, Globe } from "lucide-react";
import { useState } from "react";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const { balance, kycStatus, isLoggedIn, currentUser, logout, siteSettings, claimDailyReward, language, setLanguage } = useAppContext();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const handleClaimReward = async () => {
    setIsClaimingReward(true);
    try {
      const result = await claimDailyReward();
      if (result.success) {
        setRewardMessage(result.message || 'Reward claimed!');
        setTimeout(() => setRewardMessage(null), 3000);
      } else {
        setRewardMessage(result.error || 'Failed to claim reward');
        setTimeout(() => setRewardMessage(null), 3000);
      }
    } catch (err) {
      setRewardMessage('Error claiming reward');
      setTimeout(() => setRewardMessage(null), 3000);
    } finally {
      setIsClaimingReward(false);
    }
  };

  return (
    <>
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <div className="w-4 h-4 bg-emerald-400 rounded-sm rotate-45" />
              </div>
              NEON
            </Link>
            {currentUser?.isAdmin && (
              <Link href="/admin" className="hidden md:flex items-center gap-1 text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors font-bold bg-fuchsia-500/10 px-2 py-1 rounded border border-fuchsia-500/20">
                <Lock className="w-3 h-3" /> Admin Panel
              </Link>
            )}
            {siteSettings?.showPrototypeMessages && (
                <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Testnet
                </div>
            )}
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {!isLoggedIn ? (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Login / Register
              </button>
            ) : (
              <>
                <div className="hidden md:flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">
                  <User className="w-4 h-4" /> 
                  <Link href="/settings" className="hover:text-emerald-400 transition-colors">
                      {currentUser?.username}
                  </Link>
                </div>

                {kycStatus !== "approved" && (
                  <Link href="/kyc" className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-400">
                    {kycStatus === "pending" && <ShieldAlert className="w-5 h-5 text-amber-500" />}
                    {kycStatus === "none" && <Shield className="w-5 h-5 text-slate-400" />}
                    <span className="hidden sm:inline">
                      {kycStatus === "pending" ? "Reviewing KYC" : "Verify ID"}
                    </span>
                  </Link>
                )}

                <button 
                  onClick={handleClaimReward} 
                  disabled={isClaimingReward}
                  className="flex items-center gap-2 bg-amber-900/40 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-amber-600/50 hover:bg-amber-900/60 hover:border-amber-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Claim $20 daily reward"
                >
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-400 text-sm md:text-base hidden sm:inline">Daily</span>
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                    className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors"
                    title="Change language"
                  >
                    <Globe className="w-4 h-4 text-slate-300" />
                    <span className="text-sm font-bold text-slate-300">{language.toUpperCase()}</span>
                  </button>
                  {isLanguageOpen && (
                    <div className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50 min-w-max">
                      <button
                        onClick={() => {
                          setLanguage('en');
                          setIsLanguageOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 ${language === 'en' ? 'bg-slate-700 text-emerald-400' : 'text-slate-300 hover:bg-slate-700'} transition-colors`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => {
                          setLanguage('pl');
                          setIsLanguageOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 ${language === 'pl' ? 'bg-slate-700 text-emerald-400' : 'text-slate-300 hover:bg-slate-700'} transition-colors border-t border-slate-700`}
                      >
                        Polski
                      </button>
                    </div>
                  )}
                </div>

                <Link href="/wallet" className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-700 shadow-inner hover:bg-slate-700 transition-colors">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono font-bold text-emerald-400 text-sm md:text-base">
                    ${(balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </Link>

                <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-slate-800 rounded-md" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {rewardMessage && (
        <div className="fixed top-20 right-4 bg-amber-900/80 border border-amber-600 text-amber-100 px-4 py-2 rounded-md shadow-lg">
          {rewardMessage}
        </div>
      )}

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </>
  );
}
