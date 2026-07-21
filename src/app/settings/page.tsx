"use client";

import { useState } from "react";
import { useAppContext } from "@/app/AppContext";
import { Settings as SettingsIcon, ShieldCheck, KeyRound, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { currentUser, refreshAccounts } = useAppContext();
  
  const [password, setPassword] = useState("");
  const [is2faEnabled, setIs2faEnabled] = useState(currentUser?.is2faEnabled || false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  if (!currentUser) {
      return <div className="text-center mt-20 text-slate-400">Please log in to view settings.</div>;
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage("");
      
      try {
          const res = await fetch('/api/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  action: 'updateAccountSettings',
                  payload: { id: currentUser.id, password }
              })
          });
          
          if (res.ok) {
              await refreshAccounts(); // Trigger a re-fetch to sync context
              setMessage("Password saved successfully.");
              setIsError(false);
              setPassword(""); // Clear password field
          } else {
              setMessage("Failed to save settings.");
              setIsError(true);
          }
      } catch (err) {
          setMessage("An error occurred.");
          setIsError(true);
      }
  };

  const generate2FA = async () => {
       try {
          const res = await fetch('/api/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  action: 'generate2FASecret',
                  payload: { userId: currentUser.id }
              })
          });
          const data = await res.json();
          if (data.success) {
              import('qrcode').then((QRCode) => {
                  QRCode.default.toDataURL(data.otpauth, { width: 250, margin: 1 }, (err, url) => {
                      if (!err) setQrCodeDataUrl(url);
                  });
              });
          }
      } catch (err) {
          console.error(err);
      }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch('/api/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  action: 'enable2FA',
                  payload: { userId: currentUser.id, token: tokenInput }
              })
          });
          const data = await res.json();
          if (data.success) {
              setIs2faEnabled(true);
              setQrCodeDataUrl("");
              setTokenInput("");
              setMessage("2FA successfully enabled.");
              setIsError(false);
              refreshAccounts();
          } else {
              setMessage(data.error || "Invalid 2FA code.");
              setIsError(true);
          }
      } catch (err) {
          console.error(err);
      }
  };

  const handleDisable2FA = async () => {
       try {
          const res = await fetch('/api/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  action: 'disable2FA',
                  payload: { userId: currentUser.id }
              })
          });
          const data = await res.json();
          if (data.success) {
              setIs2faEnabled(false);
              setMessage("2FA successfully disabled.");
              setIsError(false);
              refreshAccounts();
          }
      } catch (err) {
          console.error(err);
      }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-800">
        <SettingsIcon className="w-8 h-8 text-emerald-500" />
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-slate-400">Manage your security and preferences.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          
          {message && (
              <div className={cn("mb-6 p-4 rounded-lg flex items-center gap-2", isError ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20")}>
                  {isError ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  {message}
              </div>
          )}

          <form onSubmit={handlePasswordSave} className="space-y-6">
              <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-200">
                      <KeyRound className="w-5 h-5 text-slate-400" /> Change Password
                  </h3>
                  <div className="flex gap-4">
                      <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="New password"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <button 
                          type="submit"
                          disabled={!password}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                      >
                          Save
                      </button>
                  </div>
              </div>
          </form>

          <div className="pt-8 mt-8 border-t border-slate-800">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-200">
                  <ShieldCheck className="w-5 h-5 text-slate-400" /> Two-Factor Authentication
              </h3>
              
              {is2faEnabled ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
                      <div>
                          <div className="font-bold text-emerald-400 mb-1">2FA is Currently Enabled</div>
                          <div className="text-sm text-slate-400">Your account is secured with a Time-Based One-Time Password.</div>
                      </div>
                      <button 
                          onClick={handleDisable2FA}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-6 py-2 rounded-lg font-bold transition-colors"
                      >
                          Disable
                      </button>
                  </div>
              ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                      {!qrCodeDataUrl ? (
                          <div>
                              <div className="font-bold text-slate-200 mb-2">Protect your account</div>
                              <div className="text-sm text-slate-400 mb-6 max-w-lg">
                                  Enable 2FA to require an authenticator app (like Google Authenticator or Authy) when logging in.
                              </div>
                              <button 
                                  onClick={generate2FA}
                                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                              >
                                  Setup 2FA
                              </button>
                          </div>
                      ) : (
                          <div className="flex flex-col md:flex-row gap-8 items-start">
                              <div className="bg-white p-2 rounded-xl">
                                  <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-[200px] h-[200px]" />
                              </div>
                              <div className="flex-1">
                                  <div className="font-bold text-slate-200 mb-2">Scan the QR Code</div>
                                  <div className="text-sm text-slate-400 mb-6">
                                      Open your authenticator app and scan this QR code. Then, enter the 6-digit code generated by your app to verify setup.
                                  </div>
                                  <form onSubmit={handleEnable2FA} className="flex gap-4">
                                      <input 
                                          type="text" 
                                          value={tokenInput}
                                          onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, '').slice(0,6))}
                                          placeholder="000000"
                                          className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-center text-xl tracking-widest font-mono focus:outline-none focus:border-blue-500"
                                      />
                                      <button 
                                          type="submit"
                                          disabled={tokenInput.length !== 6}
                                          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                                      >
                                          Verify & Enable
                                      </button>
                                  </form>
                              </div>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}

// Inline CN utility since imports sometimes fail in generated files without path aliases setup perfectly
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}
