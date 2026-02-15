
import React, { useMemo } from 'react';
import { GAMES, MOCK_RANKING, MOCK_UPDATES, MOCK_ACTIONS } from '../constants';
import { GameType } from '../types';

interface DashboardProps {
  activeGame: GameType | 'All';
}

export const Dashboard: React.FC<DashboardProps> = ({ activeGame }) => {
  const filteredActions = useMemo(() => {
    if (activeGame === 'All') return MOCK_ACTIONS;
    return MOCK_ACTIONS.filter((_, i) => i % 2 === 0);
  }, [activeGame]);

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in duration-700 pb-10">
      
      {/* Dynamic Context Banner */}
      {activeGame !== 'All' && (
        <div className="bg-purple-600/10 border border-purple-500/30 px-4 md:px-6 py-4 rounded-2xl md:rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-purple-600/5">
           <div className="flex items-center space-x-4 text-center sm:text-left">
             <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400">
                <i className="fas fa-filter text-sm"></i>
             </div>
             <div>
               <p className="text-sm font-bold text-slate-100">
                 Focado em <span className="text-purple-400 font-black">{activeGame}</span>
               </p>
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Cardume sincronizado</p>
             </div>
           </div>
           <button className="text-[10px] w-full sm:w-auto font-black uppercase text-slate-500 hover:text-white bg-slate-800/50 px-4 py-2 rounded-xl transition-all border border-white/5">Limpar Foco</button>
        </div>
      )}

      {/* Welcome Banner / Hero */}
      <section className="relative overflow-hidden bg-slate-900/40 border border-slate-800 rounded-[32px] md:rounded-[48px] p-6 md:p-12">
        <div className="relative z-10 max-w-2xl space-y-4 md:space-y-6">
          <div className="inline-flex items-center space-x-2 bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full">
            <i className="fas fa-sparkles text-pink-500 text-[10px]"></i>
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">Novo Evento</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
            Seja bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Cardumy</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            A central definitiva para gerenciar coleções e dominar o meta de {activeGame === 'All' ? 'qualquer TCG' : activeGame}.
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
             <button className="bg-purple-600 hover:bg-purple-700 text-white font-black px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 text-sm md:text-base">
               Minha Coleção
             </button>
             <button className="bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-3.5 rounded-2xl transition-all border border-white/5 active:scale-95 text-sm md:text-base">
               Novo Deck
             </button>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute -top-24 -right-24 w-64 md:w-96 h-64 md:h-96 bg-purple-600/10 rounded-full blur-[100px] md:blur-[120px]"></div>
        <div className="absolute -bottom-24 -left-24 w-48 md:w-64 h-48 md:h-64 bg-pink-600/10 rounded-full blur-[80px] md:blur-[100px]"></div>

        <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 w-48 h-48 items-center justify-center animate-pulse duration-[4000ms]">
          <i className="fas fa-fish-fins text-[120px] text-white/5 rotate-[15deg]"></i>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-3xl rounded-full"></div>
        </div>
      </section>

      {/* FERRAMENTAS SOCIAIS DE ELITE (CardLink e Encontrar Pessoas) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-2">
         {/* Botão CardLink */}
         <button className="group relative bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/30 p-6 md:p-8 rounded-[32px] overflow-hidden transition-all hover:border-indigo-400 hover:scale-[1.02] active:scale-95 shadow-2xl text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all"></div>
            <div className="flex items-center space-x-6">
               <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <i className="fas fa-link text-2xl"></i>
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">CardLink</h3>
                  <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-snug">Encontre quem tem a carta que você deseja na coleção.</p>
               </div>
            </div>
            <div className="absolute bottom-6 right-8 text-indigo-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
               <i className="fas fa-arrow-right"></i>
            </div>
         </button>

         {/* Botão Encontrar Pessoas */}
         <button className="group relative bg-gradient-to-br from-pink-600/20 to-purple-600/10 border border-pink-500/30 p-6 md:p-8 rounded-[32px] overflow-hidden transition-all hover:border-pink-400 hover:scale-[1.02] active:scale-95 shadow-2xl text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-pink-500/20 transition-all"></div>
            <div className="flex items-center space-x-6">
               <div className="w-16 h-16 rounded-2xl bg-pink-600/20 flex items-center justify-center text-pink-400 border border-pink-500/20 group-hover:scale-110 transition-transform">
                  <i className="fas fa-users-viewfinder text-2xl"></i>
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Encontrar Pessoas</h3>
                  <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-snug">Conecte-se e jogue com membros do cardume na sua região.</p>
               </div>
            </div>
            <div className="absolute bottom-6 right-8 text-pink-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
               <i className="fas fa-arrow-right"></i>
            </div>
         </button>
      </section>

      {/* ESPAÇO PUBLICITÁRIO (Banner de Propaganda) */}
      <section className="px-2">
         <div className="relative h-40 md:h-48 rounded-[32px] md:rounded-[40px] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200" 
              className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-[10000ms]" 
              alt="Publicidade"
            />
            <div className="absolute top-4 right-6 z-20">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] bg-slate-950/50 px-3 py-1 rounded-full border border-white/5">Patrocinado</span>
            </div>
            <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-12 space-y-2">
               <h4 className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Oferta de Lojista</h4>
               <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter max-w-sm leading-tight">Sleeves Dragon Shield com 20% OFF na Loja do Caos</h3>
               <button className="text-[9px] font-black text-white bg-purple-600 px-6 py-2 rounded-xl w-fit uppercase tracking-widest shadow-lg shadow-purple-600/20 group-hover:bg-purple-500 transition-colors">Ver Oferta</button>
            </div>
         </div>
      </section>

      {/* Stats and Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-2">
        <div className="space-y-4 md:space-y-6">
          <h3 className="text-lg md:text-xl font-bold flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
               <i className="fas fa-sparkles text-xs"></i>
            </div>
            <span>Atualizações</span>
          </h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-6 md:space-y-8 shadow-xl">
            {MOCK_UPDATES.map((update, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{update.date}</span>
                  <span className="bg-purple-600/20 text-purple-400 text-[9px] font-black px-3 py-1 rounded-full border border-purple-500/10">v.1.4.2</span>
                </div>
                <ul className="space-y-3">
                  {update.changes.map((change, cIdx) => (
                    <li key={cIdx} className="text-sm flex items-start space-x-3 group">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                      <span className="text-slate-400 leading-relaxed text-xs md:text-sm">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <h3 className="text-lg md:text-xl font-bold flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
               <i className="fas fa-bolt text-xs"></i>
            </div>
            <span>Atividade</span>
          </h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-3 md:p-4 divide-y divide-slate-800/50 shadow-xl">
            {filteredActions.length > 0 ? filteredActions.map((action, idx) => (
              <div key={idx} className="py-4 flex items-center space-x-3 md:space-x-4 px-2">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-purple-400 font-black text-xs md:text-sm">
                    {action.user[0].toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm truncate">
                    <span className="font-bold text-white">{action.user}</span> <span className="text-slate-400">{action.action}</span>
                  </p>
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">{action.timestamp}</p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-500 text-sm italic">Nenhuma ação recente.</div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-1 space-y-4 md:space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg md:text-xl font-bold flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                 <i className="fas fa-trophy text-xs"></i>
              </div>
              <span>Ranking Global</span>
            </h3>
            <button className="text-[9px] font-black uppercase text-slate-500 hover:text-white tracking-widest">Ver todos</button>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {MOCK_RANKING.map((rank) => (
              <div key={rank.rank} className="p-4 flex items-center justify-between border-b border-slate-800/50 last:border-none">
                <div className="flex items-center space-x-4">
                  <img src={rank.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-slate-900 bg-slate-800" alt={rank.name} />
                  <div>
                    <p className="text-xs md:text-sm font-bold text-slate-100">{rank.name}</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase">{rank.cards} cartas</p>
                  </div>
                </div>
                <span className={`font-black text-xl ${rank.rank === 1 ? 'text-amber-500 italic' : rank.rank === 2 ? 'text-slate-300' : 'text-amber-700'}`}>
                  #{rank.rank}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
