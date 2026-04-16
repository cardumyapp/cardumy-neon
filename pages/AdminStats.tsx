import React, { useEffect, useState } from 'react';
import { getGlobalStats, seedDatabase } from '../src/services/supabaseService';
import { motion } from 'motion/react';
import { useAuth } from '../src/components/AuthProvider';
import { OfflineWarning } from '../src/components/OfflineWarning';

export const AdminStats: React.FC = () => {
  const { isOffline } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    const data = await getGlobalStats();
    setStats(data);
    setLoading(false);
  };

  const handleSeed = async () => {
    if (confirm('Deseja realmente semear o banco de dados com dados de teste?')) {
      setSeeding(true);
      try {
        await seedDatabase();
        alert('Banco de dados semeado com sucesso!');
        fetchStats();
      } catch (error) {
        alert('Erro ao semear banco de dados. Verifique o console.');
      } finally {
        setSeeding(false);
      }
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Usuários', value: stats?.users || 0, icon: 'fa-users', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Lojas', value: stats?.stores || 0, icon: 'fa-shop', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Produtos', value: stats?.products || 0, icon: 'fa-box', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Torneios', value: stats?.tournaments || 0, icon: 'fa-trophy', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Pedidos', value: stats?.orders || 0, icon: 'fa-clipboard-list', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      {isOffline && <OfflineWarning />}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Estatísticas do Banco</h2>
          <p className="text-slate-400">Visão geral em tempo real do ecossistema Cardumy.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="bg-purple-600 hover:bg-purple-700 text-white font-black px-8 py-3.5 rounded-2xl transition-all border border-purple-500 active:scale-95 flex items-center justify-center space-x-3 disabled:opacity-50"
          >
            <i className={`fas ${seeding ? 'fa-spinner fa-spin' : 'fa-seedling'}`}></i>
            <span>{seeding ? 'Semeando...' : 'Semear Banco'}</span>
          </button>
          <button 
            onClick={fetchStats}
            className="bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-3.5 rounded-2xl transition-all border border-slate-700 active:scale-95 flex items-center justify-center space-x-3"
          >
            <i className="fas fa-sync-alt"></i>
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-8 hover:border-purple-500/30 transition-all group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg.replace('/10', '/5')} rounded-full blur-3xl -mr-10 -mt-10`}></div>
            
            <div className="flex items-center justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} text-2xl shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
              </div>
            </div>

            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '70%' }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full ${stat.color.replace('text-', 'bg-')}`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-8">
        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Status da Conexão</h3>
        {isOffline ? (
          <div className="flex items-center space-x-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <p className="text-red-400 text-sm font-bold uppercase tracking-widest">Supabase Offline</p>
          </div>
        ) : (
          <div className="flex items-center space-x-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest">Supabase Online & Sincronizado</p>
          </div>
        )}
      </div>
    </div>
  );
};
