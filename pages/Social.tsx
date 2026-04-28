
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { searchUsers, getCollectionRanking, getOffersRanking, getActivities } from '../src/services/supabaseService';

export const Social: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [rankLoading, setRankLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setActivitiesLoading(true);
      try {
        const data = await getActivities(5);
        setActivities(data);
      } catch (err) {
        // Error handling remained
      } finally {
        setActivitiesLoading(false);
      }
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

  const [collectionRankings, setCollectionRankings] = useState<any[]>([]);
  const [offersRankings, setOffersRankings] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllRankings = async () => {
      setRankLoading(true);
      try {
        const [collData, offData] = await Promise.all([
          getCollectionRanking(5),
          getOffersRanking(5)
        ]);
        setCollectionRankings(collData);
        setOffersRankings(offData);
      } catch (err) {
        // Error handling remained
      } finally {
        setRankLoading(false);
      }
    };
    fetchAllRankings();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Rankings - Now primary focus on the left */}
      <div className="lg:col-span-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Hall da Fama</h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Os maiores colecionadores e negociantes do cardume</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ranking de Coleção */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 blur-3xl -mr-24 -mt-24 group-hover:bg-purple-600/20 transition-colors"></div>
            
            <div className="flex items-center justify-between mb-8 relative">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <i className="fas fa-crown"></i>
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Colecionadores</h3>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Maior volume de cartas</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 relative">
              {rankLoading ? (
                <div className="space-y-4">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-slate-800/50 rounded-2xl animate-pulse"></div>)}
                </div>
              ) : collectionRankings.length > 0 ? (
                collectionRankings.map((item, idx) => (
                  <Link key={item.id} to={`/perfil/${item.username}`} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all group/item border border-transparent hover:border-white/5">
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-110' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {idx + 1}
                      </div>
                      <img 
                        src={item.avatar || `https://ui-avatars.com/api/?name=${item.username}&background=8b5cf6&color=fff`} 
                        className="w-10 h-10 rounded-xl border-2 border-slate-700 group-hover/item:border-purple-500 transition-all object-cover shadow-xl" 
                        alt="" 
                      />
                      <span className="text-sm font-bold text-slate-200 group-hover/item:text-white transition-colors truncate max-w-[100px]">{item.username}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-white">{item.total_cards}</span>
                      <span className="text-[8px] text-slate-500 uppercase block font-black leading-none mt-1">Cards</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 text-[10px] italic uppercase font-black tracking-widest">Nenhum dado...</div>
              )}
            </div>
          </div>

          {/* Ranking de Ofertas */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-600/10 blur-3xl -mr-24 -mt-24 group-hover:bg-pink-600/20 transition-colors"></div>
            
            <div className="flex items-center justify-between mb-8 relative">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pink-600/20 rounded-2xl flex items-center justify-center text-pink-400 border border-pink-500/20">
                  <i className="fas fa-right-left"></i>
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Negociantes</h3>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Ofertas ativas no mercado</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 relative">
              {rankLoading ? (
                <div className="space-y-4">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-slate-800/50 rounded-2xl animate-pulse"></div>)}
                </div>
              ) : offersRankings.length > 0 ? (
                offersRankings.map((item, idx) => (
                  <Link key={item.id} to={`/perfil/${item.username}`} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all group/item border border-transparent hover:border-white/5">
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-110' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {idx + 1}
                      </div>
                      <img 
                        src={item.avatar || `https://ui-avatars.com/api/?name=${item.username}&background=ec4899&color=fff`} 
                        className="w-10 h-10 rounded-xl border-2 border-slate-700 group-hover/item:border-pink-500 transition-all object-cover shadow-xl" 
                        alt="" 
                      />
                      <span className="text-sm font-bold text-slate-200 group-hover/item:text-white transition-colors truncate max-w-[100px]">{item.username}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-white">{item.offers_count}</span>
                      <span className="text-[8px] text-slate-500 uppercase block font-black leading-none mt-1">Ofertas</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 text-[10px] italic uppercase font-black tracking-widest">Nenhum dado...</div>
              )}
            </div>
          </div>
        </div>

        {/* Promo Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-[40px] p-8 md:p-10 relative overflow-hidden group shadow-2xl shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 blur-3xl -mr-40 -mt-40 group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md text-center md:text-left space-y-3">
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">Convide Amigos</h3>
              <p className="text-white/80 text-sm font-medium leading-relaxed">Ajude o cardume a crescer! Ganhe badges exclusivos de pioneiro e suba no ranking global por cada novas amizade trazida.</p>
            </div>
            <button className="px-10 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl">
              Copiar Link de Convite
            </button>
          </div>
        </div>
      </div>

      {/* Feed de Atividade - Right sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-white tracking-tight uppercase italic flex items-center">
              <i className="fas fa-bolt text-purple-500 mr-2 text-sm italic"></i>
              Feed
            </h2>
          </div>

          <div className="relative group">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-colors"></i>
            <input 
              type="text" 
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <AnimatePresence>
          {searchTerm.length >= 2 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-2 space-y-1"
            >
              {isSearching ? (
                <div className="p-4 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">Buscando...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <Link key={user.id} to={`/perfil/${user.username}`} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                    <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`} className="w-8 h-8 rounded-lg object-cover border border-slate-800 group-hover:border-purple-500 transition-all" alt="" />
                    <span className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">@{user.username}</span>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">Nenhum peixe encontrado</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {activitiesLoading ? (
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-slate-900/20 rounded-3xl border border-slate-800/50 animate-pulse"></div>)}
            </div>
          ) : activities.length > 0 ? activities.map((action, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/40 border border-slate-800 p-5 rounded-[28px] hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <Link to={`/perfil/${action.user}`} className="flex items-center space-x-3">
                  <img 
                    src={action.avatar || `https://ui-avatars.com/api/?name=${action.user}`} 
                    className="w-8 h-8 rounded-xl object-cover border border-slate-800 group-hover:border-purple-500 transition-all" 
                    alt="" 
                  />
                  <span className="text-xs font-black text-white hover:text-purple-400 transition-colors">@{action.user}</span>
                </Link>
                <button className="text-slate-600 hover:text-pink-500 transition-colors">
                  <i className="far fa-heart text-[10px]"></i>
                </button>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                {action.action}{' '}
                <span className="font-bold text-purple-400 cursor-pointer hover:underline">{action.target}</span>
              </p>
              <div className="mt-3 pt-3 border-t border-slate-800/50">
                <span className="text-[9px] text-slate-600 font-black uppercase tracking-wider">{action.timestamp}</span>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-10 bg-slate-950 border border-dashed border-slate-800 rounded-[32px]">
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">Nada por aqui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
