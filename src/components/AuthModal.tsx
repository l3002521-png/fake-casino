"use client";

import { useState } from "react";
import { useAppContext } from "@/app/AppContext";
import { X, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { login, register } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [enable2FA, setEnable2FA] = useState(false);
  const [error, setError] = useState("");

  // 2FA Mock State
  const [show2FA, setShow2FA] = useState(false);
  const [code2FA, setCode2FA] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (isLogin) {
      const result = await login(username, password);
      if (result.success) {
        if (result.requires2fa) {
          setShow2FA(true); // Move to 2FA step instead of closing immediately
        } else {
          onClose();
        }
      } else {
        setError(result.error || "Login failed");
      }
    } else {
      const result = await register(username, password, enable2FA);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Registration failed");
      }
    }
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code2FA.length === 6) {
      // In a real app, we'd verify this code against the backend.
      // Here we just accept any 6 digit code for the prototype.
      onClose();
    } else {
      setError("Invalid 2FA code. Please enter 6 digits.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {show2FA ? (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Two-Factor Auth</h2>
              <p className="text-slate-400 text-sm mt-1">Enter the 6-digit code from your authenticator app.</p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  value={code2FA}
                  onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Verify
              </button>
            </form>
          </div>
        ) : (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Enter password"
                />
              </div>

              {!isLogin && (
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={enable2FA}
                      onChange={(e) => setEnable2FA(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-950"
                    />
                    <div>
                      <span className="block text-sm font-medium">Enable 2FA (Optional)</span>
                      <span className="block text-xs text-slate-400">Add an extra layer of security to your prototype account.</span>
                    </div>
                  </label>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors mt-2"
              >
                {isLogin ? "Log In" : "Register"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400 border-t border-slate-800 pt-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="ml-2 text-emerald-400 hover:text-emerald-300 font-bold"
              >
                {isLogin ? "Register here" : "Log in here"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
