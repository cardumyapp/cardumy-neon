
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { useNotification } from '../components/NotificationProvider';
import { getMyTournaments, startTournament } from '../services/supabaseService';
import { motion, AnimatePresence } from 'motion/react';

export const ManageTournaments: React.FC = () => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const data = await getMyTournaments();
            setTournaments(data);
        } catch (error) {
            showNotification("Erro ao carregar torneios", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleStartTournament = async (id: number) => {
        try {
            const res = await startTournament(id);
            if (res.status === 'ok') {
                showNotification("Torneio iniciado com sucesso!", "success");
                fetchTournaments();
            } else {
                showNotification(res.error || "Erro ao iniciar torneio", "error");
            }
        } catch (error) {
            showNotification("Erro ao iniciar torneio", "error");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'open': return 'text-emerald-400 bg-emerald-400/10';
            case 'in_progress': return 'text-blue-400 bg-blue-400/10';
            case 'finished': return 'text-slate-400 bg-slate-400/10';
            case 'scheduled': return 'text-amber-400 bg-amber-400/10';
            default: return 'text-slate-500 bg-slate-500/10';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status.toLowerCase()) {
            case 'open': return 'Aberto';
            case 'in_progress': return 'Em Andamento';
            case 'finished': return 'Finalizado';
            case 'scheduled': return 'Agendado';
            default: return status;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter">MEUS TORNEIOS</h1>
                    <p className="text-slate-400 font-medium">Gerencie suas competições e eventos</p>
                </div>
                
                <Link 
                    to="/novo-torneio"
                    className="bg-purple-600 hover:bg-purple-500 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center space-x-2"
                >
                    <i className="fas fa-plus"></i>
                    <span>CRIAR TORNEIO</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {tournaments.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500 text-2xl">
                            <i className="fas fa-trophy"></i>
                        </div>
                        <h3 className="text-white font-bold mb-2">Nenhum torneio cadastrado</h3>
                        <p className="text-slate-500 text-sm">Crie seu primeiro torneio para começar a organizar competições.</p>
                    </div>
                ) : (
                    tournaments.map((t) => (
                        <div key={t.id} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 group hover:border-purple-500/50 transition-all duration-500">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusColor(t.status)}`}>
                                        {getStatusLabel(t.status)}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                        {t.cardgames?.name || 'Geral'}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                        {t.tournament_formats?.name || 'Livre'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{t.name}</h3>
                                <div className="flex items-center space-x-4 text-slate-400 text-xs">
                                    <span className="flex items-center space-x-1">
                                        <i className="far fa-calendar"></i>
                                        <span>{new Date(t.start_date).toLocaleDateString('pt-BR')}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                        <i className="far fa-clock"></i>
                                        <span>{new Date(t.start_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                        <i className="fas fa-users"></i>
                                        <span>Máx: {t.max_players}</span>
                                    </span>
                                    <span className="flex items-center space-x-1 text-purple-400 font-mono">
                                        <i className="fas fa-ticket"></i>
                                        <span>{t.ticket}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 w-full md:w-auto">
                                {t.status === 'open' && (
                                    <button 
                                        onClick={() => handleStartTournament(t.id)}
                                        className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest"
                                    >
                                        Iniciar
                                    </button>
                                )}
                                <Link 
                                    to={`/torneio/${t.id}`}
                                    className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all uppercase tracking-widest text-center"
                                >
                                    Ver
                                </Link>
                                <Link 
                                    to={`/torneio/${t.id}/gerenciar`}
                                    className="flex-1 md:flex-none border border-slate-700 hover:border-purple-500 hover:text-purple-400 text-slate-400 text-xs font-black px-6 py-3 rounded-xl transition-all uppercase tracking-widest text-center"
                                >
                                    Gerenciar
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
