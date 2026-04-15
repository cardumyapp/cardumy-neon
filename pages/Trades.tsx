
import React, { useState } from 'react';
import { MOCK_TRADES } from '../constants';
import { motion } from 'motion/react';

export const Trades: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Minhas Trocas' | 'Matches'>('Minhas Trocas');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Trocas & Matches</h1>
          <p className="text-slate-400 text-sm mt-1">Negocie suas cartas com outros colecionadores do cardume.</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
          {['Minhas Trocas', 'Matches'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Minhas Trocas' ? (
        <div className="grid grid-cols-1 gap-4">
          {MOCK_TRADES.map((trade, idx) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-all"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <img src={trade.partner.avatar} className="w-10 h-10 rounded-full border-2 border-slate-800" alt="" />
                    <div>
                      <h3 className="font-bold text-white text-sm">{trade.partner.name}</h3>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{trade.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-[10px] text-slate-500 font-mono">{trade.timestamp}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      trade.status === 'Pendente' ? 'bg-yellow-500/10 text-yellow-500' :
                      trade.status === 'Aceito' ? 'bg-green-500/10 text-green-500' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {trade.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex w-10 h-10 bg-slate-800 rounded-full items-center justify-center border border-slate-700 text-slate-500">
                    <i className="fas fa-right-left"></i>
                  </div>

                  {/* Offering */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Você Oferece</p>
                    <div className="flex flex-wrap gap-2">
                      {trade.offering.map((card, i) => (
                        <div key={i} className="relative group/card">
                          <img src={card.imageUrl} className="w-16 h-24 rounded-lg object-cover border border-slate-800 group-hover/card:border-purple-500 transition-all" alt="" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <i className="fas fa-magnifying-glass text-xs text-white"></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requesting */}
                  <div className="space-y-3 md:pl-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Você Recebe</p>
                    <div className="flex flex-wrap gap-2">
                      {trade.requesting.map((card, i) => (
                        <div key={i} className="relative group/card">
                          <img src={card.imageUrl} className="w-16 h-24 rounded-lg object-cover border border-slate-800 group-hover/card:border-purple-500 transition-all" alt="" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <i className="fas fa-magnifying-glass text-xs text-white"></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end space-x-3">
                  <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">Recusar</button>
                  <button className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all">Aceitar Proposta</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600 text-3xl">
            <i className="fas fa-handshake-angle"></i>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nenhum Match Encontrado</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">Complete sua Wantlist e sua Haveslist para que o Cardumy possa encontrar colecionadores com interesses mútuos.</p>
          <button className="mt-8 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all border border-white/5">
            Configurar Minhas Listas
          </button>
        </div>
      )}
    </div>
  );
};
