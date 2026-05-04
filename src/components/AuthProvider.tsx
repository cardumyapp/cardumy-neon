import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncUser, getUserByAuthId } from '../services/supabaseService';
import { devAutoLogin } from '../auth/devAutoLogin';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: any;
  loading: boolean;
  isOffline: boolean;
  login: (email?: string, password?: string) => Promise<any>;
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

  const [authError, setAuthError] = useState<string | null>(null);
  const loadingRef = React.useRef(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted && session) {
          await syncProfile(session);
        }
      } catch (err) {
        console.error('AuthProvider Error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (session) {
        await syncProfile(session);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    checkSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const syncProfile = async (session: any) => {
    try {
      const profile = await getUserByAuthId(session.user.id);
      if (profile) {
        setUser(profile);
      } else {
        // If profile doesn't exist, create it
        const synced = await syncUser({
          auth_id: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || session.user.email
        });
        if (synced) {
          setUser(synced);
        } else {
          console.error('Falha ao sincronizar perfil.');
          await logout();
        }
      }
    } catch (err) {
      console.error('Error syncing profile:', err);
    }
  };

  const login = async (email?: string, password?: string) => {
    if (email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.session;
    } else {
      // Dev login fallback
      const devSession = await devAutoLogin();
      if (devSession) window.location.reload();
      return devSession;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during Supabase signout:', err);
    }
    setUser(null);
    setLoading(false);
    // Force redirect to login and clear any stale URL params
    window.location.replace('/login');
  };

  const switchUser = (newUser: any) => {
    setUser(newUser);
    // Reload to ensure all services/headers are updated
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOffline, login, logout, switchUser }}>
      {authError ? (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 z-[9999]">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/10 mb-6">
            <i className="fas fa-triangle-exclamation text-red-500 text-3xl"></i>
          </div>
          <h2 className="text-white font-black text-xl tracking-tight mb-2">Ops! Algo deu errado</h2>
          <p className="text-slate-400 text-center text-xs font-medium max-w-xs mb-8">
            {authError}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-slate-950 font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-slate-200 transition-colors shadow-xl shadow-white/5"
          >
            Tentar Novamente
          </button>
        </div>
      ) : loading ? (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[9999]">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center animate-pulse shadow-2xl shadow-purple-600/20 mb-6">
            <i className="fas fa-fish-fins text-white text-3xl"></i>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <h2 className="text-white font-black text-xl tracking-tight">Cardumy</h2>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      ) : children}
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
