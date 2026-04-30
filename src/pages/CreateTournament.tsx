
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';
import { getCardgames, getTournamentFormats, createTournament } from '../services/supabaseService';

export const CreateTournament: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [cardgames, setCardgames] = useState<any[]>([]);
    const [formats, setFormats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        cardgame_id: '',
        format_id: '',
        max_players: 8,
        start_date: '',
        status: 'open',
        top1: '',
        top2: '',
        top3: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gamesData, formatsData] = await Promise.all([
                    getCardgames(),
                    getTournamentFormats()
                ]);
                setCardgames(gamesData);
                setFormats(formatsData);
                
                if (gamesData.length > 0) setFormData(prev => ({ ...prev, cardgame_id: String(gamesData[0].id) }));
                if (formatsData.length > 0) setFormData(prev => ({ ...prev, format_id: String(formatsData[0].id) }));
            } catch (error) {
                showNotification("Erro ao carregar dados", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await createTournament({
                ...formData,
                cardgame_id: Number(formData.cardgame_id),
                format_id: Number(formData.format_id),
                max_players: Number(formData.max_players)
            });

            if (res.status === 'ok') {
                showNotification("Torneio criado com sucesso!", "success");
                navigate('/meus-torneios');
            } else {
                showNotification(res.error || "Erro ao criar torneio", "error");
            }
        } catch (error) {
            showNotification("Erro ao criar torneio", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Novo Torneio</h1>
                <p className="text-slate-400 font-medium">Preencha os dados básicos para organizar seu evento</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nome do Torneio</label>
                    <input 
                        required
                        type="text" 
                        placeholder="Ex: Torneio Semanal Pokémon TCG"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Jogo</label>
                        <select 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                            value={formData.cardgame_id}
                            onChange={(e) => setFormData({ ...formData, cardgame_id: e.target.value })}
                        >
                            {cardgames.map(game => (
                                <option key={game.id} value={game.id}>{game.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Formato</label>
                        <select 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                            value={formData.format_id}
                            onChange={(e) => setFormData({ ...formData, format_id: e.target.value })}
                        >
                            {formats.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Data e Hora</label>
                        <input 
                            required
                            type="datetime-local" 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Vagas Máximas</label>
                        <input 
                            required
                            type="number" 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            value={formData.max_players}
                            onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Status Inicial</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['scheduled', 'open', 'finished'].map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setFormData({ ...formData, status: s })}
                                className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all uppercase tracking-widest ${
                                    formData.status === s 
                                    ? 'bg-purple-600 border-purple-500 text-white' 
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                }`}
                            >
                                {s === 'scheduled' ? 'Agendado' : s === 'open' ? 'Aberto' : 'Finalizado'}
                            </button>
                        ))}
                    </div>
                </div>

                {formData.status === 'finished' && (
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-purple-400 italic">Vencedores (IDs de Usuário)</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600">1º LUGAR</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm"
                                    value={formData.top1}
                                    onChange={(e) => setFormData({ ...formData, top1: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600">2º LUGAR</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm"
                                    value={formData.top2}
                                    onChange={(e) => setFormData({ ...formData, top2: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600">3º LUGAR</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm"
                                    value={formData.top3}
                                    onChange={(e) => setFormData({ ...formData, top3: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-4 flex items-center justify-end space-x-4">
                    <button 
                        type="button"
                        onClick={() => navigate('/meus-torneios')}
                        className="text-slate-500 hover:text-white font-bold text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        disabled={submitting}
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black px-8 py-3 rounded-2xl transition-all shadow-lg shadow-purple-600/20"
                    >
                        {submitting ? 'CRIANDO...' : 'CRIAR TORNEIO'}
                    </button>
                </div>
            </form>
        </div>
    );
};
