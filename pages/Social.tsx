
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { searchUsers, getCollectionRanking, getOffersRanking, getActivities } from '../src/services/supabaseService';

export const Social: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [rankingType, setRankingType] = useState<'colecao' | 'ofertas'>('colecao');
  const [rankings, setRankings] = useState<any[]>([]);
  const [rankLoading, setRankLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setActivitiesLoading(true);
      const data = await getActivities(10);
      setActivities(data);
      setActivitiesLoading(false);
    };
    fetchActivities();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsSearching(true);
        const results = await searchUsers(searchTerm);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const fetchRankings = async () => {
      setRankLoading(true);
      if (rankingType === 'colecao') {
        const data = await getCollectionRanking(5);
        setRankings(data);
      } else {
        const data = await getOffersRanking(5);
        setRankings(data);
      }
      setRankLoading(false);
    };
    fetchRankings();
  }, [rankingType]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Feed de Atividade */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Comunidade</h1>
            <p className="text-slate-400 text-sm mt-1">Veja o que o cardume está fazendo agora.</p>
          </div>

          <div className="relative w-full md:w-64 group">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-500 transition-colors"></i>
            <input 
              type="text" 
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
            />

            <AnimatePresence>
              {searchTerm.length >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  {isSearching ? (
                    <div className="p-4 text-center text-slate-500 text-xs">Buscando...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.map((user) => (
                        <Link 
                          key={user.id} 
                          to={`/perfil/${user.username || user.id}`}
                          className="flex items-center space-x-3 p-3 hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0"
                          onClick={() => setSearchTerm('')}
                        >
                          <img 
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=8b5cf6&color=fff`} 
                            className="w-8 h-8 rounded-full border border-slate-700"
                            alt=""
                          />
                          <div>
                            <div className="text-xs font-bold text-white">{user.username}</div>
                            <div className="text-[10px] text-slate-500">{user.codename || 'Novato'}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-xs">Nenhum usuário encontrado</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4">
          {activitiesLoading ? (
            <div className="py-20 text-center animate-pulse">
               <i className="fas fa-spinner fa-spin text-2xl text-purple-500 mb-4"></i>
               <p className="text-slate-500 text-sm italic">Carregando feed...</p>
            </div>
          ) : activities.length > 0 ? activities.map((action, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4 group hover:border-purple-500/30 transition-all"
            >
              <Link to={`/perfil/${action.user}`}>
                <img src={action.avatar || `https://i.pravatar.cc/150?u=${action.user}`} className="w-12 h-12 rounded-full border-2 border-slate-800 group-hover:border-purple-500 transition-all" alt="" />
              </Link>
              <div className="flex-1">
                <p className="text-sm text-slate-300">
                  <Link to={`/perfil/${action.user}`} className="font-bold text-white hover:text-purple-400 cursor-pointer transition-colors">{action.user}</Link>
                  {' '}{action.action}{' '}
                  <span className="font-bold text-purple-400 cursor-pointer hover:underline">{action.target}</span>
                </p>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">{action.date} {action.timestamp}</span>
              </div>
              <button className="p-2 text-slate-500 hover:text-pink-500 transition-colors">
                <i className="far fa-heart"></i>
              </button>
            </motion.div>
          )) : (
            <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
               <i className="fas fa-ghost text-4xl text-slate-700 mb-4"></i>
               <p className="text-slate-500 text-sm">O silêncio do cardume... Nada por aqui ainda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Ranking & Sugestões */}
      <div className="space-y-8">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center space-x-2">
              <i className="fas fa-trophy text-yellow-500 mr-2"></i>
              Ranking
            </h3>
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
              <button 
                onClick={() => setRankingType('colecao')}
                className={`text-[8px] font-black uppercase px-2 py-1 rounded-md transition-all ${rankingType === 'colecao' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Col.
              </button>
              <button 
                onClick={() => setRankingType('ofertas')}
                className={`text-[8px] font-black uppercase px-2 py-1 rounded-md transition-all ${rankingType === 'ofertas' ? 'bg-pink-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Of.
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {rankLoading ? (
              <div className="text-center py-10 text-slate-500 text-xs animate-pulse italic">Carregando rankings...</div>
            ) : rankings.length > 0 ? (
              rankings.map((item, idx) => (
                <Link key={item.id} to={`/perfil/${item.username}`} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 text-center font-mono text-xs ${idx < 3 ? 'text-purple-400 font-bold' : 'text-slate-600'}`}>
                      {idx + 1}
                    </div>
                    <img 
                      src={item.avatar || `https://ui-avatars.com/api/?name=${item.username}&background=8b5cf6&color=fff`} 
                      className="w-8 h-8 rounded-full border border-slate-800 group-hover:border-purple-500 transition-all object-cover" 
                      alt="" 
                    />
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors truncate max-w-[100px]">{item.username}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white">
                      {rankingType === 'colecao' ? item.total_cards : item.offers_count}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase block leading-none">
                      {rankingType === 'colecao' ? 'Cartas' : 'Ofertas'}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs italic">Nenhum dado encontrado</div>
            )}
          </div>
          <button className="w-full mt-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5">
            Ver Ranking Completo
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-2">Convide Amigos</h3>
          <p className="text-slate-400 text-xs mb-4 leading-relaxed">Ganhe badges exclusivos e suba no ranking ao trazer novos membros para o cardume.</p>
          <button className="w-full py-2.5 bg-white text-slate-950 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all">
            Gerar Link de Convite
          </button>
        </div>
      </div>
    </div>
  );
};
