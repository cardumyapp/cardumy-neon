import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncUser } from '../services/supabaseService';

interface AuthContextType {
  user: any;
  loading: boolean;
  isOffline: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS_POOL = [
  { id: 1, displayName: 'Victoria Pedretti', email: 'viped@cardumy.com', photoURL: 'https://i.pravatar.cc/150?u=victoria' },
  { id: 2, displayName: 'Matrona TCG', email: 'matrona@cardumy.com', photoURL: 'https://i.pravatar.cc/150?u=matrona' },
  { id: 3, displayName: 'Caos Gamer', email: 'caos@cardumy.com', photoURL: 'https://i.pravatar.cc/150?u=caos' },
  { id: 4, displayName: 'Luffy King', email: 'luffy@cardumy.com', photoURL: 'https://i.pravatar.cc/150?u=luffy' },
  { id: 5, displayName: 'Zoro Master', email: 'zoro@cardumy.com', photoURL: 'https://i.pravatar.cc/150?u=zoro' },
  { id: 6, displayName: 'Nami Navigator', email: 'nami@cardumy.com', photoURL: 'https://i.pravatar.cc/150?u=nami' },
  { id: 7, displayName: 'Sanji Cook', email: 'sanji@cardumy.com', photoURL: 'https://i.pravatar.cc/150?u=sanji' },
  { id: 8, displayName: 'Chopper Doc', email: 'chopper@cardumy.com', photoURL: 'https://i.pravatar.cc/150?u=chopper' },
  { id: 9, displayName: 'Robin Archaeologist', email: 'robin@cardumy.com', photoURL: 'https://i.pravatar.cc/150?u=robin' },
  { id: 10, displayName: 'Franky Shipwright', email: 'franky@cardumy.com', photoURL: 'https://i.pravatar.cc/150?u=franky' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Simulating an auto-login with a random user from the pool
    const randomUser = MOCK_USERS_POOL[Math.floor(Math.random() * MOCK_USERS_POOL.length)];
    
    const setupUser = async () => {
      const supabaseUser = await syncUser(randomUser);
      setUser(supabaseUser || randomUser);
      setLoading(false);
    };

    setupUser();
  }, []);

  const login = async () => {
    console.log("Manual login disabled. Using auto-pool.");
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOffline, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
