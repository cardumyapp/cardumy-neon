import React from 'react';
import { motion } from 'motion/react';

export const OfflineWarning: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center space-x-4 mb-6"
    >
      <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
        <i className="fas fa-wifi-slash"></i>
      </div>
      <div>
        <h4 className="text-sm font-black text-white uppercase tracking-tight">Você está offline</h4>
        <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
          A conexão com o banco de dados foi perdida. Algumas funcionalidades podem estar limitadas.
        </p>
      </div>
    </motion.div>
  );
};
