
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

interface ManageStoreProps {
    initialTab?: 'main' | 'agenda' | 'horarios';
}

export const ManageStore: React.FC<ManageStoreProps> = ({ initialTab = 'main' }) => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'main' | 'agenda' | 'horarios'>(initialTab);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [store, setStore] = useState<any>(null);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [cardgames, setCardgames] = useState<any[]>([]);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const [operatingHours, setOperatingHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({
        'Segunda': { open: '09:00', close: '18:00', closed: false },
        'Terça': { open: '09:00', close: '18:00', closed: false },
        'Quarta': { open: '09:00', close: '18:00', closed: false },
        'Quinta': { open: '09:00', close: '18:00', closed: false },
        'Sexta': { open: '09:00', close: '18:00', closed: false },
        'Sábado': { open: '09:00', close: '14:00', closed: false },
        'Domingo': { open: '00:00', close: '00:00', closed: true },
    });

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

    const handleSaveHours = async () => {
        setSaving(true);
        try {
            const success = await updateStoreInfo(store.id, { 
                horarios_funcionamento: operatingHours 
            });
            if (success) {
                showNotification("Horários de funcionamento atualizados!", "success");
            }
        } catch (error) {
            showNotification("Erro ao salvar horários", "error");
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

    if (loading) return <div className="p-8 text-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Carregando...</div>;
    if (!store) return <div className="p-8 text-center">Loja não encontrada</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Gerenciar Loja</h1>
                   <p className="text-slate-500 text-sm font-bold">Configure seu espaço no Cardumy</p>
                </div>
                
                <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
                    <button 
                        onClick={() => setActiveTab('main')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'main' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Perfil
                    </button>
                    <button 
                        onClick={() => setActiveTab('agenda')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'agenda' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Agenda
                    </button>
                    <button 
                        onClick={() => setActiveTab('horarios')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'horarios' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Horários
                    </button>
                </div>
            </header>

            {activeTab === 'main' && (
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
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nome da Loja</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Logo URL</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                            value={formData.logo || ''}
                                            onChange={(e) => setFormData({...formData, logo: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Site (Opcional)</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                            value={formData.site || ''}
                                            onChange={(e) => setFormData({...formData, site: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">WhatsApp</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                            value={formData.whatsapp || ''}
                                            onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Sobre a Loja</label>
                                    <textarea 
                                        rows={4}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors resize-none"
                                        value={formData.about || ''}
                                        onChange={(e) => setFormData({...formData, about: e.target.value})}
                                        placeholder="Nós somos a melhor loja de TCG..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Endereço</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                            value={formData.endereco || ''}
                                            onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Cidade</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                            value={formData.cidade || ''}
                                            onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">UF</label>
                                        <input 
                                            type="text"
                                            maxLength={2}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                                            value={formData.estado || ''}
                                            onChange={(e) => setFormData({...formData, estado: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black px-10 py-3 rounded-2xl shadow-xl shadow-purple-600/20 active:scale-95 text-xs uppercase tracking-widest transition-all"
                                >
                                    {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="space-y-8">
                         <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 text-center">
                            <i className="fas fa-eye text-3xl text-purple-500 mb-4 block"></i>
                            <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-widest">Visualização</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed mb-6">Veja como os jogadores visualizam sua loja no Cardumy.</p>
                            <Link 
                                to={`/loja/${store.slug}`}
                                className="inline-block w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] px-6 py-3 rounded-xl border border-white/5 transition-all uppercase tracking-widest"
                            >
                                Perfil Público
                            </Link>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 text-center">
                            <i className="fas fa-circle-question text-3xl text-slate-700 mb-4 block"></i>
                            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Suporte</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed mb-6">Precisa de ajuda com as configurações?</p>
                            <Link to="/suporte" className="text-[10px] font-black text-purple-400 hover:underline uppercase tracking-widest">Abrir Ticket</Link>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'agenda' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 md:p-8 space-y-6">
                            <h3 className="text-lg font-black text-white flex items-center italic mb-4">
                                <span className="w-1.5 h-6 bg-emerald-600 rounded-full mr-3"></span>
                                AGENDA SEMANAL
                            </h3>

                            <div className="space-y-4">
                               {schedule.length === 0 ? (
                                   <div className="text-center py-12 bg-slate-950/40 rounded-3xl border border-dashed border-slate-800">
                                       <i className="fas fa-calendar-xmark text-3xl text-slate-800 mb-3 block"></i>
                                       <p className="text-slate-500 italic text-sm">Nenhum horário fixo cadastrado.</p>
                                   </div>
                               ) : (
                                   schedule.map((item, idx) => (
                                       <div key={idx} className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                                           <div className="flex items-center space-x-4">
                                               <div className="bg-slate-800 group-hover:bg-emerald-600 transition-colors px-3 py-1 rounded-lg text-[10px] font-black text-white uppercase">{item.dia}</div>
                                               <div>
                                                   <p className="text-xs font-bold text-white uppercase">{item.game_name || item.jogo}</p>
                                                   <p className="text-[10px] text-slate-500 font-mono italic">{item.horario} • Inscrição: R$ {item.valor_insc}</p>
                                               </div>
                                           </div>
                                       </div>
                                   ))
                               )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl">
                            <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-6 italic">NOVO HORÁRIO</h3>
                            <form onSubmit={handleAddSchedule} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Jogo</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none transition-all"
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
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Dia da Semana</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none transition-all"
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
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Horário</label>
                                        <input 
                                            type="time"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white uppercase color-scheme-dark"
                                            value={newSchedule.horario}
                                            onChange={(e) => setNewSchedule({...newSchedule, horario: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Taxa (R$)</label>
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
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Observação</label>
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
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-900/20 text-xs uppercase tracking-widest mt-2 active:scale-95 transition-all"
                                >
                                    ADICIONAR À AGENDA
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'horarios' && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 md:p-8 space-y-8">
                    <h3 className="text-lg font-black text-white flex items-center italic">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3"></span>
                        HORÁRIOS DE ATENDIMENTO
                    </h3>

                    <div className="space-y-4 max-w-2xl">
                        {DAYS.map(day => (
                            <div key={day} className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                                <div className="flex items-center space-x-4">
                                    <div className="w-24 text-sm font-bold text-slate-400">{day}</div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={!operatingHours[day].closed}
                                            onChange={(e) => setOperatingHours({
                                                ...operatingHours,
                                                [day]: { ...operatingHours[day], closed: !e.target.checked }
                                            })}
                                        />
                                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {!operatingHours[day].closed ? (
                                    <div className="flex items-center space-x-3">
                                        <input 
                                            type="time" 
                                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white color-scheme-dark"
                                            value={operatingHours[day].open}
                                            onChange={(e) => setOperatingHours({
                                                ...operatingHours,
                                                [day]: { ...operatingHours[day], open: e.target.value }
                                            })}
                                        />
                                        <span className="text-slate-600 text-xs font-black italic">ATÉ</span>
                                        <input 
                                            type="time" 
                                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white color-scheme-dark"
                                            value={operatingHours[day].close}
                                            onChange={(e) => setOperatingHours({
                                                ...operatingHours,
                                                [day]: { ...operatingHours[day], close: e.target.value }
                                            })}
                                        />
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest px-3 py-1 bg-red-500/10 rounded-lg">Fechado</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleSaveHours}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black px-10 py-3 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 text-xs uppercase tracking-widest transition-all"
                    >
                        {saving ? 'SALVANDO...' : 'SALVAR HORÁRIOS'}
                    </button>
                </div>
            )}
        </div>
    );
};
