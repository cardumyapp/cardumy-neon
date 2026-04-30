
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';
import { 
    getTournamentEntries, 
    updateEntryStatus, 
    finalizeTournament, 
    startTournament,
    updateTournamentPoints
} from '../services/supabaseService';

export const ManageTournamentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { showNotification } = useNotification();
    const [tournament, setTournament] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pointsSaving, setPointsSaving] = useState<number | null>(null);

    const [winners, setWinners] = useState({
        top1: '',
        top2: '',
        top3: ''
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const tourneyRes = await fetch(`/api/torneios/${id}`);
            const tourneyData = await tourneyRes.json();
            setTournament(tourneyData);

            const entriesData = await getTournamentEntries(id);
            setEntries(entriesData);
        } catch (error) {
            showNotification("Erro ao carregar dados", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePointsUpdate = async (entryId: number, points: number) => {
        setPointsSaving(entryId);
        try {
            await updateTournamentPoints(entryId, points);
            setEntries(prev => prev.map(e => e.id === entryId ? { ...e, points } : e));
            showNotification("Pontuação atualizada!", "success");
        } catch (error) {
            showNotification("Erro ao atualizar pontos", "error");
        } finally {
            setPointsSaving(null);
        }
    };

    const handleStatusChange = async (entryId: number, status: string) => {
        try {
            await updateEntryStatus(entryId, status);
            showNotification(`Status atualizado para ${status}`, "success");
            setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status } : e));
        } catch (error) {
            showNotification("Erro ao atualizar status", "error");
        }
    };

    const handleStart = async () => {
        if (!id) return;
        try {
            const res = await startTournament(id);
            if (res.status === 'ok') {
                showNotification("Torneio iniciado!", "success");
                fetchData();
            }
        } catch (error) {
            showNotification("Erro ao iniciar", "error");
        }
    };

    const handleFinalize = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setSubmitting(true);
        try {
            const res = await finalizeTournament(id, winners);
            if (res.ok) {
                showNotification("Torneio finalizado e vencedores notificados!", "success");
                fetchData();
            }
        } catch (error) {
            showNotification("Erro ao finalizar", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;
    if (!tournament) return <div className="p-8 text-center">Torneio não encontrado</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/meus-torneios" className="text-purple-400 text-xs font-bold hover:underline mb-2 block italic">
                        <i className="fas fa-arrow-left mr-1"></i> VOLTAR AOS MEUS TORNEIOS
                    </Link>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">{tournament.name}</h1>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{tournament.cardgames?.name}</span>
                        <span className="text-slate-700">•</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{tournament.tournament_formats?.name}</span>
                        {tournament.current_round > 0 && (
                            <>
                                <span className="text-slate-700">•</span>
                                <span className="text-xs font-black text-purple-400 uppercase tracking-widest italic">Rodada {tournament.current_round}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Status Atual</span>
                    <span className="text-sm font-black text-white bg-slate-800 px-4 py-2 rounded-xl border border-white/5 italic">
                        {tournament.status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Participants List */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                            <h3 className="font-black text-white italic tracking-tighter uppercase">Inscritos ({entries.length}/{tournament.max_players})</h3>
                            {tournament.status === 'open' && (
                                <button 
                                    onClick={handleStart}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all uppercase tracking-widest"
                                >
                                    INICIAR TORNEIO
                                </button>
                            )}
                        </div>
                        <div className="divide-y divide-slate-800">
                            {entries.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 text-sm">Ninguém se inscreveu ainda.</div>
                            ) : (
                                entries.map(entry => (
                                    <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden shrink-0 shadow-inner">
                                                {entry.user?.avatar_url ? (
                                                    <img src={entry.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold">
                                                        {entry.user?.display_name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{entry.user?.display_name || entry.user?.username}</div>
                                                <div className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">@{entry.user?.username}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            {entry.status === 'approved' && (
                                                <div className="flex items-center space-x-2">
                                                    <label className="text-[8px] font-black uppercase text-slate-500">Pontos</label>
                                                    <input 
                                                        type="number"
                                                        className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-white text-center focus:border-purple-500 outline-none"
                                                        defaultValue={entry.points || 0}
                                                        onBlur={(e) => handlePointsUpdate(entry.id, parseInt(e.target.value) || 0)}
                                                        disabled={pointsSaving === entry.id}
                                                    />
                                                </div>
                                            )}

                                            {entry.status === 'pending' ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleStatusChange(entry.id, 'approved')}
                                                        className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white text-[9px] font-black px-3 py-1.5 rounded-lg border border-emerald-600/20 transition-all uppercase tracking-widest"
                                                    >
                                                        Aprovar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusChange(entry.id, 'rejected')}
                                                        className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-[9px] font-black px-3 py-1.5 rounded-lg border border-red-600/20 transition-all uppercase tracking-widest"
                                                    >
                                                        Recusar
                                                    </button>
                                                </>
                                            ) : (
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                                    entry.status === 'approved' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
                                                }`}>
                                                    {entry.status === 'approved' ? 'Aprovado' : 'Recusado'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Winners Section */}
                    {tournament.status !== 'finished' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                            <h3 className="font-black text-white italic tracking-tighter uppercase mb-4 text-purple-400">Finalizar & Reportar</h3>
                            <form onSubmit={handleFinalize} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic block">UID 1º Lugar</label>
                                    <input 
                                        type="text"
                                        placeholder="User ID"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        value={winners.top1}
                                        onChange={(e) => setWinners({ ...winners, top1: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic block">UID 2º Lugar</label>
                                    <input 
                                        type="text"
                                        placeholder="User ID"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        value={winners.top2}
                                        onChange={(e) => setWinners({ ...winners, top2: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic block">UID 3º Lugar</label>
                                    <input 
                                        type="text"
                                        placeholder="User ID"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        value={winners.top3}
                                        onChange={(e) => setWinners({ ...winners, top3: e.target.value })}
                                    />
                                </div>
                                <button 
                                    disabled={submitting}
                                    type="submit"
                                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20 uppercase tracking-widest mt-2"
                                >
                                    {submitting ? 'PROCESSANDO...' : 'FINALIZAR TORNEIO'}
                                </button>
                            </form>
                        </div>
                    )}

                    {tournament.status === 'finished' && (
                        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                               <i className="fas fa-trophy text-6xl text-emerald-500"></i>
                           </div>
                           <h3 className="font-black text-emerald-400 italic tracking-tighter uppercase mb-4 flex items-center space-x-2">
                               <i className="fas fa-check-circle"></i>
                               <span>TORNEIO FINALIZADO</span>
                           </h3>
                           <div className="space-y-3">
                               <div className="flex items-center justify-between text-sm">
                                   <span className="text-slate-500 font-bold uppercase text-[10px]">1º LUGAR:</span>
                                   <span className="text-emerald-400 font-black italic">{tournament.top1 || 'N/A'}</span>
                               </div>
                               <div className="flex items-center justify-between text-sm">
                                   <span className="text-slate-500 font-bold uppercase text-[10px]">2º LUGAR:</span>
                                   <span className="text-white font-black italic">{tournament.top2 || 'N/A'}</span>
                               </div>
                               <div className="flex items-center justify-between text-sm">
                                   <span className="text-slate-500 font-bold uppercase text-[10px]">3º LUGAR:</span>
                                   <span className="text-amber-600 font-black italic">{tournament.top3 || 'N/A'}</span>
                               </div>
                           </div>
                        </div>
                    )}

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        <h3 className="font-black text-white italic tracking-tighter uppercase mb-4 text-slate-500">INFO ADICIONAL</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 block mb-1">Link de Inscrição</label>
                                <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[10px] text-purple-400 font-mono break-all group relative cursor-pointer" onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/torneio/${tournament.id}`);
                                    showNotification("Link copiado!", "success");
                                }}>
                                    <span className="opacity-60 group-hover:opacity-100 transition-opacity">Clique para copiar o link público</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 block mb-1">Ticket de busca</label>
                                <div className="text-xl font-black text-white font-mono italic tracking-widest">{tournament.ticket}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
