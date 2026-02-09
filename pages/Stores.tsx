
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_STORES } from '../constants';
import { GameType } from '../types';

export const Stores: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string>('Todos');

  // Simple logic to mock if a store is "Open" (just for visual flair)
  const isOpen = (storeId: string) => storeId === 's2'; 

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
      {/* Hero Header */}
      <div className="relative mb-12 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/10"></div>
        <div className="relative px-8 py-12 md:px-12 md:py-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Comunidade Ativa</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">Lojas Parceiras</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Encontre o lugar perfeito para seus duelos. Explore as melhores lojas de TCG, participe de torneios exclusivos e conecte-se com jogadores locais.
            </p>
          </div>
          <div className="flex-shrink-0">
             <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-inner">
                <p className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Acesso Rápido</p>
                <div className="flex flex-col space-y-3">
                   <button className="flex items-center space-x-3 text-sm text-slate-300 hover:text-white transition-colors">
                     <i className="fas fa-map-marked-alt text-purple-500 w-5"></i>
                     <span>Ver mapa interativo</span>
                   </button>
                   <button className="flex items-center space-x-3 text-sm text-slate-300 hover:text-white transition-colors">
                     <i className="fas fa-calendar-check text-pink-500 w-5"></i>
                     <span>Calendário de eventos</span>
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-20 mb-10 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <i className="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
            <input 
              type="text" 
              placeholder="Buscar por nome ou cidade..." 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
          <div className="h-8 w-px bg-slate-800 hidden md:block"></div>
          <div className="flex space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {['Todos', 'Pokémon', 'One Piece', 'Magic', 'Yu-Gi-Oh!'].map(game => (
              <button 
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedGame === game 
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {game}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {MOCK_STORES.map((store) => (
          <div 
            key={store.id} 
            className={`group relative bg-slate-900/40 rounded-3xl border transition-all duration-500 hover:-translate-y-1 ${
              store.isPartner 
              ? 'border-purple-500/30 hover:border-purple-500 shadow-xl hover:shadow-purple-500/10' 
              : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Store Header Image */}
            <div className="h-32 w-full overflow-hidden rounded-t-3xl relative">
              <img 
                src={`https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=600`} 
                className="w-full h-full object-cover brightness-50 group-hover:scale-110 transition-transform duration-700" 
                alt="Store Interior" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
              
              {/* Floating Badge */}
              <div className="absolute top-4 right-4 flex flex-col items-end space-y-2">
                {store.isPartner && (
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    Parceiro Oficial
                  </span>
                )}
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md border ${
                  isOpen(store.id) 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-800/50 text-slate-400 border-white/10'
                }`}>
                  {isOpen(store.id) ? 'Aberto agora' : 'Fechado'}
                </span>
              </div>
            </div>

            <div className="p-8 -mt-12 relative z-10">
              <div className="flex items-end justify-between mb-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <img src={store.logo} className="relative w-24 h-24 rounded-2xl object-cover border-4 border-slate-900 bg-slate-800 shadow-xl" alt={store.name} />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors">{store.name}</h3>
                <div className="flex items-center text-slate-400 text-sm space-x-2">
                  <i className="fas fa-map-pin text-pink-500"></i>
                  <span>{store.location}</span>
                </div>
              </div>

              <Link 
                to={`/loja/${store.id}`}
                className="w-full mt-4 bg-slate-800 hover:bg-purple-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2 border border-white/5 group-hover:border-purple-500/50"
              >
                <span>Ver Perfil Completo</span>
                <i className="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
              </Link>
            </div>
          </div>
        ))}

        {/* Suggest Store Card */}
        <div className="group border-2 border-dashed border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer">
           <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 group-hover:text-purple-400 group-hover:scale-110 transition-all">
             <i className="fas fa-plus text-3xl"></i>
           </div>
           <div className="space-y-2">
             <h4 className="text-xl font-bold text-slate-200">Sua loja aqui?</h4>
             <p className="text-sm text-slate-500 max-w-[200px]">Torne-se um parceiro Cardumy e alcance milhares de jogadores.</p>
           </div>
           <button className="text-purple-400 font-bold text-sm hover:underline">Saber mais →</button>
        </div>
      </div>
    </div>
  );
};
