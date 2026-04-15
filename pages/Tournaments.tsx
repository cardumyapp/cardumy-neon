
import React, { useState } from 'react';
import { MOCK_TOURNAMENTS, GAMES } from '../constants';
import { GameType } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const Tournaments: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType | 'All'>('All');

  const filteredTournaments = MOCK_TOURNAMENTS.filter(t => activeGame === 'All' || t.game === activeGame);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Torneios & Eventos</h1>
          <p className="text-slate-400 text-sm mt-1">Encontre os melhores eventos de TCG perto de você.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveGame('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${activeGame === 'All' ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}
          >
            Todos
          </button>
          {GAMES.map(game => (
            <button 
              key={game.type}
              onClick={() => setActiveGame(game.type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center space-x-2 ${activeGame === game.type ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}
            >
              <i className={`fas ${game.icon}`}></i>
              <span>{game.type}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tourney, idx) => (
          <motion.div
            key={tourney.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-all flex flex-col"
          >
            <div className="relative h-48 overflow-hidden">
              <img src={tourney.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={tourney.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                  {tourney.game}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white">
                   <i className="fas fa-calendar-day text-xs text-purple-400"></i>
                   <span className="text-xs font-bold">{tourney.date}</span>
                </div>
                <div className="flex items-center space-x-2 text-white">
                   <i className="fas fa-users text-xs text-purple-400"></i>
                   <span className="text-xs font-bold">{tourney.filledSpots}/{tourney.totalSpots}</span>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">{tourney.name}</h3>
              <div className="flex items-center space-x-2 text-slate-400 mb-6">
                <i className="fas fa-location-dot text-xs"></i>
                <span className="text-xs">{tourney.location}</span>
              </div>

              <div className="mt-auto flex items-center justify-between">
                <div className="text-white">
                  <span className="text-[10px] text-slate-500 uppercase font-black block leading-none mb-1">Inscrição</span>
                  <span className="text-lg font-bold">R$ {tourney.price.toFixed(2)}</span>
                </div>
                <Link 
                  to={`/evento/${tourney.id}`}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition-all border border-white/5"
                >
                  Ver Detalhes
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
