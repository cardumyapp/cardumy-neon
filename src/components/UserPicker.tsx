
import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../services/supabaseService';

interface UserPickerProps {
    onSelect: (user: any) => void;
    onClose: () => void;
}

export const UserPicker: React.FC<UserPickerProps> = ({ onSelect, onClose }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await getAllUsers();
            setUsers(data);
            setLoading(false);
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u => 
        (u.codename?.toLowerCase() || u.username?.toLowerCase() || '').includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white">Mudar Sessão</h3>
                        <p className="text-xs text-slate-500">Escolha um perfil para carregar</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-4 border-b border-slate-800">
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                        <input 
                            type="text" 
                            placeholder="Buscar usuário..."
                            className="w-full bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-purple-500 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <span className="text-xs font-bold text-slate-500">Carregando usuários...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-1">
                            {filteredUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => onSelect(u)}
                                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all group"
                                >
                                    <img 
                                        src={(u.role_id === 6 ? u.store_logo : u.avatar) || `https://i.pravatar.cc/150?u=${u.id}`} 
                                        className="w-10 h-10 rounded-full border-2 border-slate-700 group-hover:border-purple-500 transition-colors object-cover bg-slate-800"
                                        alt=""
                                    />
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-white">{u.codename || u.username || 'Sem Nome'}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                            {u.role_id === 6 ? 'Lojista' : 'Membro'}
                                        </p>
                                    </div>
                                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                        <i className="fas fa-chevron-right text-purple-500 text-xs"></i>
                                    </div>
                                </button>
                            ))}
                            {filteredUsers.length === 0 && (
                                <div className="text-center py-12">
                                    <i className="fas fa-user-slash text-slate-700 text-3xl mb-3"></i>
                                    <p className="text-sm text-slate-600 font-bold">Nenhum usuário encontrado</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-950/50 text-center">
                    <p className="text-[10px] text-slate-500 font-medium">Ambiente de Desenvolvimento Cardumy</p>
                </div>
            </div>
        </div>
    );
};
