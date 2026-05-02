import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncUser, getUserByAuthId } from '../services/supabaseService';
import { devAutoLogin } from '../auth/devAutoLogin';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: any;
  loading: boolean;
  isOffline: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (newUser: any) => void;
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
    const initAuth = async () => {
      setLoading(true);
      try {
        // 1. Tenta login automático de dev
        const session = await devAutoLogin();
        
        if (session) {
          // 2. Se logado no Supabase, sincroniza os dados do perfil (tabela public.users)
          const profile = await getUserByAuthId(session.user.id);
          if (profile) {
            setUser(profile);
            localStorage.setItem('cardumy_impersonated_user', JSON.stringify(profile));
          } else {
            // Se não tiver perfil, tenta sincronizar
            const synced = await syncUser({
              auth_id: session.user.id,
              email: session.user.email,
              displayName: session.user.user_metadata?.full_name || session.user.email
            });
            setUser(synced);
          }
        } else {
          // Fallback para o sistema de impersonation existente se o login dev falhar
          const savedUser = localStorage.getItem('cardumy_impersonated_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (error) {
        console.error('Erro na inicialização do Auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async () => {
    await devAutoLogin();
    window.location.reload();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('cardumy_impersonated_user');
  };

  const switchUser = (newUser: any) => {
    setUser(newUser);
    localStorage.setItem('cardumy_impersonated_user', JSON.stringify(newUser));
    // Reload to ensure all services/headers are updated
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOffline, login, logout, switchUser }}>
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
