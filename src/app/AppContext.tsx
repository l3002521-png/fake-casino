"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { type Language, getSystemLanguage } from "@/utils/language";

export type KYCStatus = "none" | "pending" | "approved";

export interface Account {
  id: string;
  username: string;
  password?: string;
  kycStatus: KYCStatus;
  kycDoc?: string;
  isAdmin: boolean;
  is2faEnabled: boolean;
  balance: number;
}

interface AppState {
  balance: number;
  kycStatus: KYCStatus;
  isLoggedIn: boolean;
  currentUser: Account | null;
  accounts: Account[];
  siteSettings: { showPrototypeMessages: boolean, showDisclaimerScreen: boolean, autoApproveKYC: boolean };
  language: Language;
  setLanguage: (lang: Language) => void;
  addBalance: (amount: number) => Promise<void>;
  deductBalance: (amount: number) => Promise<boolean>;
  submitKYC: (doc: string) => Promise<void>;
  approveKYC: (accountId: string) => Promise<void>;
  rejectKYC: (accountId: string) => Promise<void>;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string; requires2fa?: boolean; userId?: string }>;
  register: (username: string, password?: string, is2faEnabled?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAccounts: () => Promise<void>;
  logGame: (game: string, bet: number, win: number, multiplier: number) => Promise<void>;
  claimDailyReward: () => Promise<{ success: boolean; error?: string; message?: string }>;
  transferFunds: (toUsername: string, amount: number) => Promise<{ success: boolean; error?: string; message?: string }>;
  getCryptoPortfolio: (userId: string) => Promise<{ [key: string]: number }>;
  buyCrypto: (symbol: string, amount: number, currentPrice: number) => Promise<{ success: boolean; error?: string }>;
  sellCrypto: (symbol: string, amount: number, currentPrice: number) => Promise<{ success: boolean; error?: string }>;
  getCryptoHistory: (userId: string) => Promise<any[]>;
  requestWithdrawal: (amount: number) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateUserOdds: (userId: string, gameName: string, houseEdge: number, multiplier: number) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mounted, setMounted] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ showPrototypeMessages: true, showDisclaimerScreen: true, autoApproveKYC: false });
  const [language, setLanguageState] = useState<Language>('en');

  const balance = currentUser ? currentUser.balance : 0;
  const kycStatus = currentUser ? currentUser.kycStatus : "none";

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('casino_language', lang);
  };

  const refreshSiteSettings = useCallback(async () => {
      try {
          const res = await fetch('/api/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'getSiteSettings', payload: {} })
          });
          const data = await res.json();
          if (data.success && data.settings) {
              setSiteSettings(data.settings);
          }
      } catch (e) {
          console.error("Failed to fetch settings", e);
      }
  }, []);

  const refreshAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((a: Account & Record<string, unknown>) => ({
            ...a,
            kycStatus: a.kycStatus ?? a.kycstatus ?? 'none',
            isAdmin: Boolean(a.isAdmin ?? a.isadmin),
            is2faEnabled: Boolean(a.is2faEnabled ?? a.is2faenabled),
            balance: Number(a.balance ?? 0),
        }));
        setAccounts(formatted);
      }
    } catch (e) {
      console.error("Failed to fetch accounts", e);
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
     if (!currentUser?.id) return;
     try {
       // Only fetch the specific user instead of all accounts
       const res = await fetch('/api/action', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ action: 'getUser', payload: { id: currentUser.id } })
       });
       if (res.ok) {
         const data = await res.json();
         if (data.success && data.user) {
           const formattedUser = {
              ...data.user,
              kycStatus: data.user.kycStatus ?? data.user.kycstatus ?? 'none',
              isAdmin: Boolean(data.user.isAdmin ?? data.user.isadmin),
              is2faEnabled: Boolean(data.user.is2faEnabled ?? data.user.is2faenabled),
              balance: Number(data.user.balance ?? 0),
           };
           
           setCurrentUser((prev: Account | null) => {
               if (!prev || JSON.stringify(prev) !== JSON.stringify(formattedUser)) {
                   localStorage.setItem("casino_current_user", JSON.stringify(formattedUser));
                   return formattedUser;
               }
               return prev;
           });
         }
       }
     } catch (e) {
       console.error("Failed to refresh user", e);
     }
  }, [currentUser?.id]); // Only recreate if user ID changes

  useEffect(() => {
    const init = async () => {
      await refreshSiteSettings();
      const savedUser = localStorage.getItem("casino_current_user");
      if (savedUser) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          setIsLoggedIn(true);
      }
      const savedLanguage = localStorage.getItem("casino_language") as Language | null;
      if (savedLanguage) {
          setLanguageState(savedLanguage);
      } else {
          setLanguageState(getSystemLanguage());
      }
      setMounted(true);
    };
    init();
  }, [refreshSiteSettings]);

  // Sync state across multiple tabs/windows
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "casino_current_user" && e.newValue) {
         setCurrentUser(JSON.parse(e.newValue));
      } else if (e.key === "casino_current_user" && !e.newValue) {
         setCurrentUser(null);
         setIsLoggedIn(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [mounted]);

  // Periodic polling only for balance/KYC updates of the logged-in user
  useEffect(() => {
      if (!isLoggedIn || !currentUser?.id) return;
      const intervalId = setInterval(() => {
          refreshCurrentUser();
      }, 5000); 
      return () => clearInterval(intervalId);
  }, [isLoggedIn, currentUser?.id, refreshCurrentUser]);

  // Periodic polling for Admin only to get the list of users
  useEffect(() => {
      // Use primitive flag to prevent continuous triggering
      const isAdminUser = Boolean(isLoggedIn && currentUser?.isAdmin);
      
      if (!isAdminUser) return;
      
      refreshAccounts(); // Initial fetch
      const intervalId = setInterval(() => {
          refreshAccounts();
      }, 5000); 
      return () => clearInterval(intervalId);
  }, [isLoggedIn, currentUser?.isAdmin, refreshAccounts]);

  // Periodic polling for site settings
  useEffect(() => {
      const intervalId = setInterval(() => {
          refreshSiteSettings();
      }, 10000); 
      return () => clearInterval(intervalId);
  }, [refreshSiteSettings]);

  const apiCall = async (action: string, payload: any) => {
      const res = await fetch('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload })
      });
      return res.json();
  };

  const addBalance = async (amount: number) => {
    if (!currentUser) return;
    const res = await apiCall('updateBalance', { id: currentUser.id, amount });
    if (res.success) {
        setCurrentUser({ ...currentUser, balance: res.balance });
        await refreshAccounts();
    }
  };

  const deductBalance = async (amount: number): Promise<boolean> => {
    if (!currentUser) return false;
    if (currentUser.balance >= amount) {
      const res = await apiCall('updateBalance', { id: currentUser.id, amount: -amount });
      if (res.success) {
          setCurrentUser({ ...currentUser, balance: res.balance });
          await refreshAccounts();
          return true;
      }
    }
    return false;
  };

  const login = async (username: string, password?: string) => {
      const res = await apiCall('login', { username, password });
      if (res.success) {
          if (res.requires2fa) {
              return { success: true, requires2fa: true, userId: res.userId };
          }
          setCurrentUser(res.user);
          setIsLoggedIn(true);
          localStorage.setItem("casino_current_user", JSON.stringify(res.user));
          return { success: true };
      }
      return { success: false, error: res.error };
  };

  const register = async (username: string, password?: string, is2faEnabled: boolean = false) => {
     const res = await apiCall('register', { username, password, is2faEnabled });
     if (res.success) {
         setCurrentUser(res.user);
         setIsLoggedIn(true);
         localStorage.setItem("casino_current_user", JSON.stringify(res.user));
         await refreshAccounts();
         return { success: true };
     }
     return { success: false, error: res.error };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("casino_current_user");
  };

  const submitKYC = async (doc: string) => {
    if (!currentUser) return;
    const res = await apiCall('submitKYC', { id: currentUser.id, doc });
    if (res.success) {
        setCurrentUser({ ...currentUser, kycStatus: "pending" });
        await refreshAccounts();
    }
  };

  const approveKYC = async (accountId: string) => {
    const res = await apiCall('approveKYC', { id: accountId });
    if (res.success) {
        await refreshAccounts();
    }
  };

  const rejectKYC = async (accountId: string) => {
    const res = await apiCall('rejectKYC', { id: accountId });
    if (res.success) {
        await refreshAccounts();
    }
  };

  const logGame = async (game: string, bet: number, win: number, multiplier: number) => {
      if (!currentUser) return;
      await apiCall('logGame', { userId: currentUser.id, game, bet, win, multiplier });
  };

  const claimDailyReward = async () => {
      if (!currentUser) return { success: false, error: 'Not logged in' };
      const res = await apiCall('claimDailyReward', { userId: currentUser.id });
      if (res.success) {
          setCurrentUser({ ...currentUser, balance: res.balance });
          await refreshAccounts();
      }
      return { success: res.success, error: res.error, message: res.message };
  };

  const transferFunds = async (toUsername: string, amount: number) => {
      if (!currentUser) return { success: false, error: 'Not logged in' };
      const res = await apiCall('transferFunds', { fromUserId: currentUser.id, toUsername, amount });
      if (res.success) {
          setCurrentUser({ ...currentUser, balance: res.newBalance });
          await refreshAccounts();
      }
      return { success: res.success, error: res.error, message: res.message };
  };

  const getCryptoPortfolio = async (userId: string) => {
    const res = await apiCall('getCryptoPortfolio', { userId });
    return res.holdings || {};
  };

  const buyCrypto = async (symbol: string, amount: number, currentPrice: number) => {
    if (!currentUser) return { success: false, error: 'Not logged in' };
    const res = await apiCall('buyCrypto', { userId: currentUser.id, symbol, amount, currentPrice });
    if (res.success) {
      const totalCost = amount * currentPrice;
      setCurrentUser({ ...currentUser, balance: currentUser.balance - totalCost });
    }
    return { success: res.success, error: res.error };
  };

  const sellCrypto = async (symbol: string, amount: number, currentPrice: number) => {
    if (!currentUser) return { success: false, error: 'Not logged in' };
    const res = await apiCall('sellCrypto', { userId: currentUser.id, symbol, amount, currentPrice });
    if (res.success) {
      const totalValue = amount * currentPrice;
      setCurrentUser({ ...currentUser, balance: currentUser.balance + totalValue });
    }
    return { success: res.success, error: res.error };
  };

  const getCryptoHistory = async (userId: string) => {
    const res = await apiCall('getCryptoHistory', { userId });
    return res.transactions || [];
  };

  const requestWithdrawal = async (amount: number) => {
    if (!currentUser) return { success: false, error: 'Not logged in' };
    const res = await apiCall('requestWithdrawal', { userId: currentUser.id, amount, ethAddress: '' });
    if (res.success) {
      setCurrentUser({ ...currentUser, balance: currentUser.balance - amount });
    }
    return { success: res.success, error: res.error, message: res.message };
  };

  const updateUserOdds = async (userId: string, gameName: string, houseEdge: number, multiplier: number) => {
    const res = await apiCall('updateUserOdds', { userId, gameName, houseEdge, multiplier });
    return { success: res.success, error: res.error };
  };

  if (!mounted) {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        balance,
        kycStatus,
        isLoggedIn,
        currentUser,
        accounts,
        siteSettings,
        language,
        setLanguage,
        addBalance,
        deductBalance,
        submitKYC,
        approveKYC,
        rejectKYC,
        login,
        register,
        logout,
        refreshAccounts,
        logGame,
        claimDailyReward,
        transferFunds,
        getCryptoPortfolio,
        buyCrypto,
        sellCrypto,
        getCryptoHistory,
        requestWithdrawal,
        updateUserOdds
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

