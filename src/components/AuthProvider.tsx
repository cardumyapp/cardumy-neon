import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncUser, getRandomUser } from '../services/supabaseService';

interface AuthContextType {
  user: any;
  loading: boolean;
  isOffline: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    // Para ambiente de teste: Busca um usuário real do banco de dados
    const setupTestSession = async () => {
      setLoading(true);
      try {
        console.log('Ambiente de teste: Buscando usuário real do banco...');
        
        // Tenta buscar um usuário aleatório do banco
        const dbUser = await getRandomUser();
        
        if (dbUser) {
          console.log(`Usuário real encontrado: ${dbUser.display_name || dbUser.username || dbUser.email}`);
          setUser(dbUser);
        } else {
          console.warn('Nenhum usuário encontrado no banco. Fallback para mock necessário para inicialização.');
          // Fallback mínimo se o banco estiver vazio para não quebrar o app
          const defaultUser = { 
            id: 1, 
            displayName: 'Admin User', 
            email: 'cardumyapp@gmail.com',
            photoURL: 'https://i.pravatar.cc/150?u=admin'
          };
          const synced = await syncUser(defaultUser);
          setUser(synced || defaultUser);
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
