
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { useNotification } from '../components/NotificationProvider';
import { 
    getMyStore, 
    updateStoreInfo, 
    getStoreSchedule, 
    addStoreSchedule, 
    getCardgames
} from '../services/supabaseService';
import { GameType } from '../types';

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const ManageStore: React.FC = () => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [store, setStore] = useState<any>(null);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [cardgames, setCardgames] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        logo: '',
        site: '',
        endereco: '',
        bairro: '',
        cidade: '',
        estado: '',
        whatsapp: '',
        instagram: '',
        about: ''
    });

    const [newSchedule, setNewSchedule] = useState({
        game_id: '',
        dia: 'Segunda',
        horario: '19:00',
        valor_insc: '0',
        observacao: ''
    });

    useEffect(() => {
        if (user && user.role_id === 6) {
            fetchData();
        } else if (user) {
            navigate('/');
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const myStore = await getMyStore();
            if (myStore) {
                setStore(myStore);
                setFormData({
                    name: myStore.name || '',
                    logo: myStore.logo || '',
                    site: myStore.site || '',
                    endereco: myStore.endereco || '',
                    bairro: myStore.bairro || '',
                    cidade: myStore.cidade || '',
                    estado: myStore.estado || '',
                    whatsapp: myStore.contato?.whatsapp || '',
                    instagram: myStore.redes_sociais?.instagram || '',
                    about: myStore.about || ''
                });

                const scheduleData = await getStoreSchedule(myStore.id);
                setSchedule(scheduleData);

                const games = await getCardgames();
                setCardgames(games);
            }
        } catch (error) {
            showNotification("Erro ao carregar dados da loja", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const dataToUpdate = {
                ...formData,
                contato: { whatsapp: formData.whatsapp },
                redes_sociais: { instagram: formData.instagram }
            };
            const success = await updateStoreInfo(store.id, dataToUpdate);
            if (success) {
                showNotification("Informações da loja atualizadas!", "success");
            }
        } catch (error) {
            showNotification("Erro ao salvar", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleAddSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSchedule.game_id) {
            showNotification("Selecione um jogo", "error");
            return;
        }
        try {
            const success = await addStoreSchedule({
                store_id: store.id,
                ...newSchedule,
                valor_insc: parseFloat(newSchedule.valor_insc) || 0
            });
            if (success) {
                showNotification("Agenda atualizada", "success");
                fetchData();
                setNewSchedule({
                    game_id: '',
                    dia: 'Segunda',
                    horario: '19:00',
                    valor_insc: '0',
                    observacao: ''
                });
            }
        } catch (error) {
            showNotification("Erro ao adicionar agenda", "error");
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;
    if (!store) return <div className="p-8 text-center">Loja não encontrada</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex items-center justify-between">
                <div>
                   <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Gerenciar Loja</h1>
                   <p className="text-slate-500 text-sm font-bold">Configure seu perfil público no Cardumy</p>
                </div>
                <button 
                  onClick={() => navigate(`/loja/${store.slug}`)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] px-6 py-2.5 rounded-xl border border-white/5 transition-all uppercase tracking-widest"
                >
                  <i className="fas fa-eye mr-2"></i> Ver Perfil Público
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Info Form */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 md:p-8 space-y-6">
                        <h3 className="text-lg font-black text-white flex items-center italic mb-4">
                            <span className="w-1.5 h-6 bg-purple-600 rounded-full mr-3"></span>
                            INFORMAÇÕES BÁSICAS
                        </h3>
                        <form onSubmit={handleSaveInfo} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500">Nome da Loja</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500">Logo URL</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                        value={formData.logo}
                                        onChange={(e) => setFormData({...formData, logo: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500">Site (Opcional)</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                        value={formData.site}
                                        onChange={(e) => setFormData({...formData, site: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500">WhatsApp</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                        value={formData.whatsapp}
                                        onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500">Sobre a Loja</label>
                                <textarea 
                                    rows={4}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors resize-none"
                                    value={formData.about}
                                    onChange={(e) => setFormData({...formData, about: e.target.value})}
                                    placeholder="Nós somos a melhor loja de TCG..."
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500">Endereço</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                        value={formData.endereco}
                                        onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500">Cidade</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                        value={formData.cidade}
                                        onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500">UF</label>
                                    <input 
                                        type="text"
                                        maxLength={2}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                        value={formData.estado}
                                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={saving}
                                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black px-10 py-3 rounded-2xl shadow-xl shadow-purple-600/20 active:scale-95 text-xs uppercase tracking-widest"
                            >
                                {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                            </button>
                        </form>
                    </div>

                    {/* Schedule List */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 md:p-8 space-y-6">
                        <h3 className="text-lg font-black text-white flex items-center italic mb-4">
                            <span className="w-1.5 h-6 bg-emerald-600 rounded-full mr-3"></span>
                            AGENDA SEMANAL
                        </h3>

                        <div className="space-y-4">
                           {schedule.length === 0 ? (
                               <p className="text-slate-500 italic text-sm text-center py-8">Nenhum horário fixo cadastrado.</p>
                           ) : (
                               schedule.map((item, idx) => (
                                   <div key={idx} className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                                       <div className="flex items-center space-x-4">
                                           <div className="bg-slate-800 px-3 py-1 rounded-lg text-[10px] font-black text-white uppercase">{item.dia}</div>
                                           <div>
                                               <p className="text-xs font-bold text-white uppercase">{item.game_name || item.jogo}</p>
                                               <p className="text-[10px] text-slate-500 font-mono">{item.horario} • R$ {item.valor_insc}</p>
                                           </div>
                                       </div>
                                       <div className="flex items-center space-x-2">
                                            {/* Delete action could go here */}
                                       </div>
                                   </div>
                               ))
                           )}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                     {/* Add to Schedule */}
                     <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl">
                        <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-6 italic">NOVO HORÁRIO</h3>
                        <form onSubmit={handleAddSchedule} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Jogo</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
                                    value={newSchedule.game_id}
                                    onChange={(e) => setNewSchedule({...newSchedule, game_id: e.target.value})}
                                >
                                    <option value="">Selecione o Jogo</option>
                                    {cardgames.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dia da Semana</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
                                    value={newSchedule.dia}
                                    onChange={(e) => setNewSchedule({...newSchedule, dia: e.target.value})}
                                >
                                    {DAYS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Horário</label>
                                    <input 
                                        type="time"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white uppercase color-scheme-dark"
                                        value={newSchedule.horario}
                                        onChange={(e) => setNewSchedule({...newSchedule, horario: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Taxa (R$)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                                        value={newSchedule.valor_insc}
                                        onChange={(e) => setNewSchedule({...newSchedule, valor_insc: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Observação</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                                    placeholder="Ex: Formato Modern"
                                    value={newSchedule.observacao}
                                    onChange={(e) => setNewSchedule({...newSchedule, observacao: e.target.value})}
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-900/20 text-xs uppercase tracking-widest mt-2"
                            >
                                ADICIONAR À AGENDA
                            </button>
                        </form>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 text-center">
                        <i className="fas fa-circle-question text-3xl text-slate-700 mb-4 block"></i>
                        <h4 className="text-xs font-bold text-slate-400 mb-2">Precisa de ajuda?</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed mb-4">Se você encontrar problemas ao configurar sua loja, entre em contato com nosso suporte.</p>
                        <Link to="/suporte" className="text-[10px] font-black text-purple-400 hover:underline uppercase tracking-widest">Abrir Ticket</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
