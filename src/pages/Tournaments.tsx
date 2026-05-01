
import React, { useState, useEffect } from 'react';
import { GameType, Tournament } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { getCardgames, getAllTournaments, getGameIcon } from '../services/supabaseService';

export const Tournaments: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType | 'All'>('All');
  const [torneios, setTorneios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbGames, setDbGames] = useState<any[]>([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      const games = await getCardgames();
      setDbGames(games);
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchTourneys = async () => {
      setLoading(true);
      const data = await getAllTournaments();
      if (data) {
        const mapped = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          game: t.cardgames?.name as GameType,
          date: new Date(t.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          location: 'Local da Loja',
          price: 0, // Not in table as per error report
          totalSpots: t.max_players || 0,
          filledSpots: 0,
          status: t.status === 'scheduled' ? 'Agendado' : 'Aberto',
          imageUrl: t.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600'
        }));
        setTorneios(mapped);
      }
      setLoading(false);
    };
    fetchTourneys();
  }, []);

  const filteredTournaments = (torneios || []).filter(t => t && (activeGame === 'All' || t.game === activeGame));

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
          {dbGames.map(game => (
            <button 
              key={game.id}
              onClick={() => setActiveGame((game.slug || game.name) as GameType)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center space-x-2 ${activeGame === (game.slug || game.name) ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}
            >
              <i className={`fas ${getGameIcon(game.name)}`}></i>
              <span>{game.name}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <i className="fas fa-calendar-times text-4xl text-slate-700 mb-4"></i>
          <h3 className="text-xl font-bold text-white">Nenhum evento encontrado</h3>
          <p className="text-slate-500 mt-2">Tente mudar o filtro ou volte mais tarde.</p>
        </div>
      ) : (
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
                  <span className="text-lg font-bold">R$ {(tourney.price || 0).toFixed(2)}</span>
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
    )}
    </div>
  );
};
