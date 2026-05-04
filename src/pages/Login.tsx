import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legacyFlowRequired, setLegacyFlowRequired] = useState(false);

  React.useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) throw anonError;
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar como visitante');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login('dev@cardumy.app', 'caos1234');
      navigate('/');
    } catch (err: any) {
      setError('Erro na conta demo: ' + (err.message || 'Credenciais inválidas'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Better error messaging for invalid credentials
      if (err.message?.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos. Verifique seus dados.');
      } else {
        setError(err.message || 'Erro ao realizar login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, informe seu e-mail primeiro.');
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setError('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de recuperação');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 bg-slate-950">
      <div className="absolute top-4 right-4">
        <button 
          onClick={handleClearData}
          className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-red-500 transition-colors bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-800"
          title="Limpar dados locais e recarregar"
        >
          <i className="fas fa-trash-can mr-2"></i>
          Limpar Cache
        </button>
      </div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8 bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800/50 backdrop-blur-2xl shadow-3xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
        
        <div>
          <div className="flex justify-center">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-600/20 mb-8"
            >
              <i className="fas fa-fish-fins text-4xl text-white"></i>
            </motion.div>
          </div>
          <h2 className="text-center text-3xl font-black text-white tracking-tight leading-tight">
            Seja bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Cardumy</span>
          </h2>
          <p className="mt-3 text-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Sua jornada colecionável começa aqui
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-2xl text-[10px] font-bold border ${legacyFlowRequired ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
            >
              <div className="flex gap-3">
                <i className={`fas ${legacyFlowRequired ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'} mt-0.5`}></i>
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="flex gap-2 mb-2">
              <button 
                type="button"
                onClick={() => setEmail('usuario@cardumy.member')}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-[9px] font-black text-slate-400 hover:text-white hover:border-purple-500/50 transition-all uppercase tracking-tighter"
              >
                Membro
              </button>
              <button 
                type="button"
                onClick={() => setEmail('loja@cardumy.store')}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-[9px] font-black text-slate-400 hover:text-white hover:border-purple-500/50 transition-all uppercase tracking-tighter"
              >
                Lojista
              </button>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">E-mail de Acesso</label>
              <div className="relative group">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-colors"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all outline-none"
                  placeholder="ex: usuario@cardumy.member"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Sua Senha</label>
              <div className="relative group">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-colors"></i>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all outline-none"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative flex-[2] flex justify-center py-5 px-4 border border-transparent text-xs font-black uppercase tracking-[0.2em] rounded-2xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all shadow-xl shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <i className="fas fa-circle-notch fa-spin text-lg"></i> : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="flex-1 py-5 px-2 text-[10px] font-black uppercase tracking-widest text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl transition-all"
              title="Entrar com conta de teste"
            >
              Demo
            </button>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ou</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          <button
            type="button"
            onClick={handleAnonymousLogin}
            disabled={loading}
            className="w-full py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl transition-all"
          >
            Continuar como Visitante
          </button>

          {legacyFlowRequired && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              type="button"
              onClick={handleResetPassword}
              className="w-full py-4 px-4 text-[10px] font-black uppercase tracking-widest text-white bg-orange-600 hover:bg-orange-500 rounded-2xl transition-colors shadow-lg shadow-orange-600/20"
            >
              Ativar Conta Legado
            </motion.button>
          )}
        </form>

        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-bold">
            Problemas com a senha? <span onClick={handleResetPassword} className="text-purple-400 hover:text-purple-300 font-black cursor-pointer transition-colors">Recuperar agora</span>
          </p>
        </div>
        
        <div className="pt-6 border-t border-slate-800/50">
          <p className="text-[9px] text-slate-600 text-center leading-relaxed">
            Ao entrar você concorda com nossos <span className="text-slate-500 hover:text-white cursor-pointer transition-colors">Termos de Uso</span> e <span className="text-slate-500 hover:text-white cursor-pointer transition-colors">Políticas de Privacidade</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
