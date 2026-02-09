
import React, { useMemo } from 'react';
import { GAMES, MOCK_RANKING, MOCK_UPDATES, MOCK_ACTIONS } from '../constants';
import { GameType } from '../types';

interface DashboardProps {
  activeGame: GameType | 'All';
}

export const Dashboard: React.FC<DashboardProps> = ({ activeGame }) => {
  const filteredActions = useMemo(() => {
    // Note: Since MOCK_ACTIONS doesn't have game info currently, we mock filtering 
    // by pretending some cards belong to specific games based on their target string
    if (activeGame === 'All') return MOCK_ACTIONS;
    return MOCK_ACTIONS.filter((_, i) => i % 2 === 0); // Mock logic for filtered view
  }, [activeGame]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Dynamic Context Banner */}
      {activeGame !== 'All' && (
        <div className="bg-purple-600/10 border border-purple-500/30 px-6 py-4 rounded-3xl flex items-center justify-between shadow-lg shadow-purple-600/5">
           <div className="flex items-center space-x-4">
             <div className="w-10 h-10 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-400">
                <i className="fas fa-filter text-sm"></i>
             </div>
             <div>
               <p className="text-sm font-bold text-slate-100">
                 Dashboard focado em <span className="text-purple-400 font-black">{activeGame}</span>
               </p>
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Sincronizado com seu cardume global</p>
             </div>
           </div>
           <button className="text-[10px] font-black uppercase text-slate-500 hover:text-white bg-slate-800/50 px-4 py-2 rounded-xl transition-all border border-white/5 hover:bg-slate-800">Limpar Foco</button>
        </div>
      )}

      {/* Welcome Banner */}
      <section className="relative overflow-hidden bg-slate-900/40 border border-slate-800 rounded-3xl p-8 md:p-12">
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full">
            <i className="fas fa-sparkles text-pink-500 text-[10px]"></i>
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">Novo Evento Disponível</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
            Bem-vindo de volta ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Cardume</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Sua central completa para gerenciar coleções, construir decks e dominar o meta de {activeGame === 'All' ? 'qualquer TCG' : activeGame}.
          </p>
          <div className="flex space-x-4 pt-2">
             <button className="bg-purple-600 hover:bg-purple-700 text-white font-black px-8 py-3 rounded-2xl transition-all shadow-lg shadow-purple-600/20 active:scale-95">
               Ver Minha Coleção
             </button>
             <button className="bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-3 rounded-2xl transition-all border border-white/5 active:scale-95">
               Novo Deck
             </button>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none p-12 hidden md:block">
           <i className="fas fa-fish-fins text-[200px] -rotate-12 text-white"></i>
        </div>
      </section>

      {/* Game Selector (Secondary/Static) */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
        {GAMES.map((game) => (
          <button 
            key={game.type}
            className={`flex flex-col items-center justify-center p-4 bg-slate-900/50 border rounded-2xl hover:border-purple-500 hover:bg-slate-800 transition-all group ${activeGame === game.type ? 'border-purple-500 bg-slate-800 shadow-lg shadow-purple-600/10' : 'border-slate-800'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors ${activeGame === game.type ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-500 group-hover:text-purple-400'}`}>
               <i className={`fas ${game.icon} text-lg`}></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-none">{game.type}</span>
          </button>
        ))}
      </div>

      {/* Stats and Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
               <i className="fas fa-sparkles text-xs"></i>
            </div>
            <span>Atualizações</span>
          </h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-8 shadow-xl">
            {MOCK_UPDATES.map((update, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{update.date}</span>
                  <span className="bg-purple-600/20 text-purple-400 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-purple-500/10">v.1.4.2</span>
                </div>
                <ul className="space-y-3">
                  {update.changes.map((change, cIdx) => (
                    <li key={cIdx} className="text-sm flex items-start space-x-3 group">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] group-hover:scale-125 transition-transform"></div>
                      <span className="text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
               <i className="fas fa-bolt text-xs"></i>
            </div>
            <span>Atividade do Cardume</span>
          </h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-4 divide-y divide-slate-800/50 shadow-xl">
            {filteredActions.length > 0 ? filteredActions.map((action, idx) => (
              <div key={idx} className="py-4 flex items-center space-x-4 group hover:bg-slate-800/30 px-2 rounded-2xl transition-all">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center text-purple-400 font-black group-hover:border-purple-500 transition-colors">
                    {action.user[0].toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="font-bold text-white hover:text-purple-400 cursor-pointer">{action.user}</span> <span className="text-slate-400">{action.action}</span> <span className="font-mono text-purple-400">{action.target}</span>
                  </p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">{action.timestamp}</p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-500 text-sm italic">Nenhuma ação recente para este foco.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                 <i className="fas fa-trophy text-xs"></i>
              </div>
              <span>Ranking Global</span>
            </h3>
            <button className="text-[10px] font-black uppercase text-slate-500 hover:text-white tracking-widest transition-colors">Ver todos →</button>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {MOCK_RANKING.map((rank) => (
              <div key={rank.rank} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-all cursor-pointer border-b border-slate-800/50 last:border-none group">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className={`absolute -inset-0.5 rounded-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity ${rank.rank === 1 ? 'bg-amber-500' : 'bg-purple-500'}`}></div>
                    <img src={rank.avatar} className="relative w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800" alt={rank.name} />
                    {rank.isTop && (
                      <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-[8px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-lg">
                        <i className="fas fa-crown text-white"></i>
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100">{rank.name}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{rank.cards} cartas</p>
                  </div>
                </div>
                <div className="text-right">
                   <span className={`font-black text-2xl ${rank.rank === 1 ? 'text-amber-500 italic' : rank.rank === 2 ? 'text-slate-300' : rank.rank === 3 ? 'text-amber-700' : 'text-slate-700'}`}>
                    #{rank.rank}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
