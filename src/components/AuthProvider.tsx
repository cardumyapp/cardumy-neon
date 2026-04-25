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
    // Para ambiente de teste: Se não houver usuário logado, tenta pegar um aleatório do Supabase
    const setupTestSession = async () => {
      setLoading(true);
      try {
        console.log('Ambiente de teste: Buscando usuário aleatório...');
        
        // Primeiro tentamos ver se já temos um no pool local para não demorar
        const randomMock = MOCK_USERS_POOL[Math.floor(Math.random() * MOCK_USERS_POOL.length)];
        
        // Sincroniza com o Supabase para garantir que temos um perfil real
        const syncedProfile = await syncUser(randomMock);
        
        if (syncedProfile) {
          setUser(syncedProfile);
        } else {
          setUser(randomMock);
        }
      } catch (error) {
        console.error('Erro ao configurar sessão de teste:', error);
      } finally {
        setLoading(false);
      }
    };

    setupTestSession();
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
