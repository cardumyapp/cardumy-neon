import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncUser, getUserByAuthId } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: any;
  supabaseUser: any;
  loading: boolean;
  isOffline: boolean;
  login: (email?: string, password?: string) => Promise<any>;
  logout: () => Promise<void>;
  switchUser: (newUser: any) => void;
  confirmAndLoadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null); // Database Profile
  const [supabaseUser, setSupabaseUser] = useState<any>(null); // Raw Auth User
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

  useEffect(() => {
    let isMounted = true;
    let authCheckTimeout: any;

    const handleAuthAction = async (session: any) => {
      if (!isMounted) return;

      try {
        if (session) {
          console.log("[AUTH]: Sessão detectada para", session.user.email);
          setSupabaseUser(session.user);
          const confirmed = localStorage.getItem('session_confirmed') === 'true';
          
          if (confirmed) {
            try {
              const profile = await getUserByAuthId(session.user.id);
              if (isMounted) {
                if (profile) {
                  setUser(profile);
                } else {
                  console.warn("[AUTH]: Perfil não encontrado, tentando sincronização automática...");
                  const synced = await syncUser({
                    auth_id: session.user.id,
                    email: session.user.email || '',
                    displayName: session.user.user_metadata?.username || session.user.email?.split('@')[0] || ''
                  });
                  if (isMounted) {
                    if (synced) {
                      setUser(synced);
                    } else {
                      console.error("[AUTH]: Falha ao sincronizar perfil. Resetando confirmação.");
                      localStorage.removeItem('session_confirmed');
                    }
                  }
                }
              }
            } catch (err) {
              console.error("[AUTH]: Erro na sincronização de perfil:", err);
            }
          }
        } else {
          console.log("[AUTH]: Nenhuma sessão ativa.");
          setSupabaseUser(null);
          setUser(null);
          localStorage.removeItem('session_confirmed');
        }
      } catch (err) {
        console.error("[AUTH]: Erro crítico no handleAuthAction:", err);
      } finally {
        if (isMounted) {
          console.log("[AUTH]: Finalizando loading.");
          setLoading(false);
          if (authCheckTimeout) clearTimeout(authCheckTimeout);
        }
      }
    };

    // Safety timeout to prevent infinite loading if Supabase calls hang
    authCheckTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("[AUTH]: Timeout de segurança atingido. Forçando fim do loading.");
        setLoading(false);
      }
    }, 5000);

    // 1. Initial Check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[AUTH]: Erro inicial:", error.message);
        handleAuthAction(null);
      } else {
        handleAuthAction(session);
      }
    }).catch(err => {
      console.error("[AUTH]: Falha fatal no check inicial:", err);
      if (isMounted) setLoading(false);
    });

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AUTH EVENT]: ${event}`);
      if (event === 'SIGNED_OUT') {
        handleAuthAction(null);
      } else if (session) {
        handleAuthAction(session);
      } else if (event === 'INITIAL_SESSION') {
        // Handle initial session event if needed
      }
    });

    return () => {
      isMounted = false;
      if (authCheckTimeout) clearTimeout(authCheckTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const confirmAndLoadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      localStorage.setItem('session_confirmed', 'true');
      setLoading(true);
      try {
        const profile = await getUserByAuthId(session.user.id);
        if (profile) {
          setUser(profile);
        } else {
          const synced = await syncUser({
            auth_id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.username || session.user.email?.split('@')[0] || ''
          });
          if (synced) setUser(synced);
        }
      } catch (error) {
        console.error("Falha ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const login = async (email?: string, password?: string) => {
    localStorage.removeItem('session_confirmed');
    
    if (email && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.session;
      } catch (error: any) {
        // Tratamento para "Invalid Refresh Token" ou sessão corrompida
        if (error.message?.includes('Refresh Token') || error.status === 400) {
          await forceLogout();
        }
        throw error;
      }
    } else {
      throw new Error('E-mail e senha são obrigatórios.');
    }
  };

  const forceLogout = async () => {
    localStorage.clear(); 
    await supabase.auth.signOut();
    window.location.reload();
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('session_confirmed');
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Erro ao sair:', error.message);
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setUser(null);
      setSupabaseUser(null);
      window.location.href = '/login';
    }
  };

  const switchUser = (newUser: any) => {
    setUser(newUser);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, isOffline, login, logout, switchUser, confirmAndLoadProfile }}>
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
