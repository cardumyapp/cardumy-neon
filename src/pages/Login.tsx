import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthProvider';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl"
      >
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 mb-6">
              <i className="fas fa-bolt text-3xl text-white"></i>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-black text-white tracking-tight">
            Bem-vindo ao Cardumy
          </h2>
          <p className="mt-2 text-center text-xs text-slate-400 font-medium">
            Entre na sua conta para continuar sua jornada colecionador
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={() => login()}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all shadow-lg shadow-purple-600/20"
          >
            Entrar
          </button>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-medium">
            Ainda não tem uma conta? <span className="text-purple-400 hover:text-purple-300 cursor-pointer">Crie uma agora</span>
          </p>
        </div>
        
        <div className="pt-4 border-t border-slate-800">
          <p className="text-[9px] text-slate-600 text-center italic">
            Nota: Este é um ambiente de demonstração. O botão "Entrar" realizará o login automático.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
