import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { getReceivedOrders, getMyTournaments } from '../services/supabaseService';

export const LojistaDashboard: React.FC = () => {
    const { user } = useAuth();
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orders, myTournaments] = await Promise.all([
                    getReceivedOrders(),
                    getMyTournaments()
                ]);
                setRecentOrders(orders.slice(0, 5));
                setTournaments(myTournaments.slice(0, 3));
            } catch (error) {
                console.error("Error fetching lojista stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.id]);

    const stats = [
        { label: 'Pedidos Pendentes', value: recentOrders.filter(o => o.status === 'pending').length, icon: 'fa-clock', color: 'text-yellow-500' },
        { label: 'Vendas Totais', value: recentOrders.length, icon: 'fa-cart-shopping', color: 'text-emerald-500' },
        { label: 'Torneios Ativos', value: tournaments.length, icon: 'fa-trophy', color: 'text-purple-500' },
        { label: 'Visitas (Mês)', value: '1.2k', icon: 'fa-eye', color: 'text-blue-500' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Painel de Controle</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Gerencie seu império TCG</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/novo-torneio" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center">
                        <i className="fas fa-plus mr-2"></i> Criar Torneio
                    </Link>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-[24px] flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${stat.color} mb-3`}>
                            <i className={`fas ${stat.icon}`}></i>
                        </div>
                        <span className="text-2xl font-black text-white">{stat.value}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <section className="bg-slate-900/40 border border-slate-800 rounded-[32px] overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">Pedidos Recentes</h2>
                        <Link to="/pedidos-recebidos" className="text-[10px] font-black text-purple-500 uppercase">Ver todos</Link>
                    </div>
                    <div className="p-2">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500 animate-pulse font-bold uppercase text-xs">Carregando...</div>
                        ) : recentOrders.length > 0 ? (
                            recentOrders.map((order, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-800/50 rounded-2xl transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                                            #{order.id.toString().slice(-3)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">R$ {order.amount?.toFixed(2)}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                                        order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                                        order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                        'bg-slate-800 text-slate-400'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-slate-500 italic text-sm">Nenhum pedido recente.</div>
                        )}
                    </div>
                </section>

                {/* Quick Management */}
                <section className="space-y-6">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest px-2">Ações Rápidas</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link to="/gerenciar-estoque" className="group b-slate-900/40 border border-slate-800 p-8 rounded-[32px] hover:border-purple-500/30 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-boxes-stacked text-xl"></i>
                            </div>
                            <h3 className="font-black text-white uppercase tracking-tight group-hover:text-purple-400 transition-colors">Repor Estoque</h3>
                            <p className="text-xs text-slate-500 mt-1">Atualize as quantidades de produtos disponíveis na sua vitrine.</p>
                        </Link>
                        
                        <Link to="/minha-loja" className="group bg-slate-900/40 border border-slate-800 p-8 rounded-[32px] hover:border-emerald-500/30 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-store text-xl"></i>
                            </div>
                            <h3 className="font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">Configurações</h3>
                            <p className="text-xs text-slate-500 mt-1">Ajuste horários, localização e imagem de capa da loja.</p>
                        </Link>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-purple-900/20 border border-slate-800 p-8 rounded-[40px] relative overflow-hidden group">
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Precisa de Ajuda?</h3>
                                <p className="text-xs text-slate-400 mt-2 max-w-xs">Fale com nosso time de suporte para otimizar suas vendas no Cardumy.</p>
                                <Link to="/suporte" className="inline-flex items-center mt-4 text-[10px] font-black text-purple-400 uppercase tracking-widest hover:text-white transition-colors">
                                    Abrir Chamado <i className="fas fa-arrow-right ml-2 text-[8px]"></i>
                                </Link>
                            </div>
                            <i className="fas fa-headset text-6xl text-white/5 group-hover:rotate-12 transition-transform duration-700"></i>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
