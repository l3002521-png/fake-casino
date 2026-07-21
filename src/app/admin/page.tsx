"use client";

import { useAppContext } from "@/app/AppContext";
import { Check, X, Shield, Lock, Users, Trash2, History } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/utils/cn";

export default function AdminPage() {
  const { accounts, currentUser, approveKYC, rejectKYC, siteSettings, refreshAccounts } = useAppContext();

  const [historyData, setHistoryData] = useState<{ [userId: string]: any[] }>({});
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);

  const handleSettingsToggle = async (key: 'showPrototypeMessages' | 'showDisclaimerScreen') => {
      try {
          await fetch('/api/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  action: 'updateSiteSettings', 
                  payload: {
                      ...siteSettings,
                      [key]: !siteSettings[key]
                  } 
              })
          });
          // Optimistically update UI, but a refresh from polling will confirm
          // This is a bit hacky, but avoids a full page reload.
          window.location.reload(); 
      } catch (e) {
          console.error("Failed to update settings", e);
      }
  };

  const fetchHistory = async (userId: string) => {
      try {
          const res = await fetch('/api/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'getHistory', payload: { userId } })
          });
          const data = await res.json();
          if (data.success) {
              setHistoryData(prev => ({ ...prev, [userId]: data.history }));
          }
      } catch (e) {
          console.error("Failed to fetch history", e);
      }
  };

  const handleDeleteAccount = async (id: string, username: string) => {
      if (!confirm(`Are you absolutely sure you want to delete ${username}? This cannot be undone.`)) return;
      
      try {
          await fetch('/api/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'deleteAccount', payload: { id } })
          });
          window.location.reload();
      } catch (e) {
          console.error("Failed to delete account", e);
      }
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            You do not have administrative privileges to view this page. Log in with the 'admin' account.
          </p>
        </div>
      </div>
    );
  }

  const pendingAccounts = accounts.filter(a => a.kycStatus === "pending");

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-800">
        <Lock className="w-8 h-8 text-fuchsia-500" />
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-slate-400">Manage prototype data and simulate KYC reviews.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-lg text-blue-500">
                <Users className="w-6 h-6" />
            </div>
            <div>
                <div className="text-2xl font-bold">{accounts.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Users</div>
            </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-amber-500/10 p-3 rounded-lg text-amber-500">
                <Shield className="w-6 h-6" />
            </div>
            <div>
                <div className="text-2xl font-bold">{pendingAccounts.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Pending KYC</div>
            </div>
        </div>

        <div className="col-span-1 md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center gap-2">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Global Site Settings</div>
            <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Show Prototype Notices (Navbar/KYC)</span>
                <input 
                    type="checkbox" 
                    checked={siteSettings?.showPrototypeMessages ?? true}
                    onChange={() => handleSettingsToggle('showPrototypeMessages')}
                    className="w-4 h-4 rounded border-slate-700 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-slate-900 bg-slate-800"
                />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Show Initial Disclaimer Screen</span>
                <input 
                    type="checkbox" 
                    checked={siteSettings?.showDisclaimerScreen ?? true}
                    onChange={() => handleSettingsToggle('showDisclaimerScreen')}
                    className="w-4 h-4 rounded border-slate-700 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-slate-900 bg-slate-800"
                />
            </label>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-500" /> Pending KYC Reviews
        </h2>

        {pendingAccounts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No pending KYC applications found.
          </div>
        ) : (
          <div className="space-y-6">
            {pendingAccounts.map((account) => (
              <div key={account.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-6 items-start md:items-center">
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-slate-800 px-2 py-1 rounded text-xs font-mono text-slate-400">ID: {account.id}</span>
                    <span className="font-bold text-lg">{account.username}</span>
                    {account.is2faEnabled && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold border border-emerald-500/20">2FA</span>}
                  </div>
                  
                  {account.kycDoc ? (
                    <div className="relative w-full max-w-sm aspect-[4/3] rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                      <Image 
                        src={account.kycDoc} 
                        alt="KYC Document" 
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-800 rounded-lg text-sm text-slate-400">
                      No document image data found.
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => approveKYC(account.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                  >
                    <Check className="w-5 h-5" /> Approve
                  </button>
                  <button 
                    onClick={() => rejectKYC(account.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-900/50 px-6 py-3 rounded-lg font-bold transition-colors"
                  >
                    <X className="w-5 h-5" /> Reject
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin actions for users */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
           <Users className="w-5 h-5 text-blue-500" /> Manage User Balances
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-medium">Username</th>
                <th className="py-3 px-4 font-medium">KYC Status</th>
                <th className="py-3 px-4 font-medium">Balance</th>
                <th className="py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <tr key={account.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                  <td className="py-3 px-4 font-medium">{account.username} {account.isAdmin && <span className="text-xs text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded ml-2">Admin</span>}</td>
                  <td className="py-3 px-4 text-sm">
                    {account.kycStatus === 'approved' && <span className="text-emerald-400">Verified</span>}
                    {account.kycStatus === 'pending' && <span className="text-amber-400">Pending</span>}
                    {account.kycStatus === 'none' && <span className="text-slate-500">None</span>}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400">${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <button 
                      onClick={async () => {
                        const amount = prompt(`Add balance to ${account.username}:`, "1000");
                        if (amount && !isNaN(parseFloat(amount))) {
                            await fetch('/api/action', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'updateBalance', payload: { id: account.id, amount: parseFloat(amount) } })
                            });
                            // Refresh the admin view
                            window.location.reload();
                        }
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-sm px-3 py-1.5 rounded transition-colors text-white"
                    >
                      + Funds
                    </button>
                    <button 
                        onClick={() => {
                            if (showHistoryFor === account.id) {
                                setShowHistoryFor(null);
                            } else {
                                setShowHistoryFor(account.id);
                                fetchHistory(account.id);
                            }
                        }}
                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                        title="View Play History"
                    >
                        <History className="w-4 h-4" />
                    </button>
                    {!account.isAdmin && (
                        <button 
                            onClick={() => handleDeleteAccount(account.id, account.username)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                            title="Delete Account"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal / Section */}
      {showHistoryFor && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                      <History className="w-5 h-5 text-blue-500" /> Play History ({accounts.find(a => a.id === showHistoryFor)?.username})
                  </h2>
                  <button onClick={() => setShowHistoryFor(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {(!historyData[showHistoryFor] || historyData[showHistoryFor].length === 0) ? (
                  <div className="text-center py-8 text-slate-500">No play history recorded yet.</div>
              ) : (
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead>
                              <tr className="border-b border-slate-800 text-slate-400">
                                  <th className="py-2 px-4 font-medium">Time</th>
                                  <th className="py-2 px-4 font-medium">Game</th>
                                  <th className="py-2 px-4 font-medium">Bet</th>
                                  <th className="py-2 px-4 font-medium">Multiplier</th>
                                  <th className="py-2 px-4 font-medium">Payout</th>
                              </tr>
                          </thead>
                          <tbody>
                              {historyData[showHistoryFor].map((entry: any, i: number) => (
                                  <tr key={i} className="border-b border-slate-800/30 hover:bg-slate-800/10">
                                      <td className="py-2 px-4 text-slate-400">{new Date(entry.timestamp).toLocaleString()}</td>
                                      <td className="py-2 px-4 font-bold capitalize">{entry.game}</td>
                                      <td className="py-2 px-4 font-mono text-slate-300">${entry.bet.toFixed(2)}</td>
                                      <td className="py-2 px-4 font-mono text-slate-300">{entry.multiplier.toFixed(2)}x</td>
                                      <td className={cn("py-2 px-4 font-mono font-bold", entry.win > 0 ? "text-emerald-400" : "text-slate-500")}>
                                          {entry.win > 0 ? `+$${entry.win.toFixed(2)}` : "$0.00"}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}
