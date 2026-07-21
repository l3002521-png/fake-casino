"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

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
  siteSettings: { showPrototypeMessages: boolean, showDisclaimerScreen: boolean };
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
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mounted, setMounted] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ showPrototypeMessages: true, showDisclaimerScreen: true });

  const balance = currentUser ? currentUser.balance : 0;
  const kycStatus = currentUser ? currentUser.kycStatus : "none";

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
        // Convert integer booleans from sqlite back to boolean
        const formatted = data.map((a: any) => ({
            ...a,
            isAdmin: Boolean(a.isAdmin),
            is2faEnabled: Boolean(a.is2faEnabled)
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
              isAdmin: Boolean(data.user.isAdmin),
              is2faEnabled: Boolean(data.user.is2faEnabled)
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
          setCurrentUser(res.user);
          setIsLoggedIn(true);
          localStorage.setItem("casino_current_user", JSON.stringify(res.user));
          return { success: true, requires2fa: res.user.is2faEnabled };
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
        addBalance,
        deductBalance,
        submitKYC,
        approveKYC,
        rejectKYC,
        login,
        register,
        logout,
        refreshAccounts,
        logGame
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

