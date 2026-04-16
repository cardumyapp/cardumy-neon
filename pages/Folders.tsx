
import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/components/AuthProvider';
import { getBinders, createBinder } from '../src/services/supabaseService';
import { GAMES } from '../constants';
import { OfflineWarning } from '../src/components/OfflineWarning';
import { supabase } from '../src/lib/supabase';

interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  cardCount: number;
  estimatedValue: number;
  isSystem?: boolean;
  gameName?: string;
}

export const FoldersPage: React.FC = () => {
  const { user, isOffline } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dbGames, setDbGames] = useState<any[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');

  useEffect(() => {
    const fetchGames = async () => {
      const { data } = await supabase.from('cardgames').select('*');
      if (data) {
        setDbGames(data);
        if (data.length > 0) setSelectedGameId(data[0].id.toString());
      }
    };
    fetchGames();
  }, []);

  useEffect(() => {
    if (!user) return;

    const systemFolders: Folder[] = [
      { id: 'colecao', name: 'Minha Coleção', icon: 'fa-box-archive', color: 'bg-purple-600', cardCount: 0, estimatedValue: 0, isSystem: true },
      { id: 'wishlist', name: 'Wishlist', icon: 'fa-heart', color: 'bg-pink-600', cardCount: 0, estimatedValue: 0, isSystem: true },
      { id: 'offerlist', name: 'Offerlist (Trocas)', icon: 'fa-right-left', color: 'bg-emerald-600', cardCount: 0, estimatedValue: 0, isSystem: true },
    ];

    const unsubscribe = getBinders(user.id, (dbBinders) => {
      const customFolders: Folder[] = dbBinders.map(b => ({
        id: b.id,
        name: b.name,
        icon: 'fa-folder',
        color: 'bg-slate-800',
        cardCount: 0,
        estimatedValue: 0,
        gameName: dbGames.find(g => g.id.toString() === b.game_id.toString())?.name || 'Personalizada'
      }));
      setFolders([...systemFolders, ...customFolders]);
    });

    return () => unsubscribe();
  }, [user, dbGames]);

  const handleCreateBinder = async () => {
    if (!user || !newFolderName.trim() || !selectedGameId) return;
    const game = dbGames.find(g => g.id.toString() === selectedGameId);
    await createBinder(user.id, newFolderName, selectedGameId, game?.name || '');
    setIsModalOpen(false);
    setNewFolderName('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      {isOffline && <OfflineWarning />}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Suas Pastas</h2>
          <p className="text-slate-400">Organize sua coleção, metas de troca e listas de desejo.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-black px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center space-x-3"
        >
          <i className="fas fa-plus"></i>
          <span>Nova Pasta</span>
        </button>
      </div>

      <section className="space-y-6">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-2">Pastas do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {folders.filter(f => f.isSystem).map(folder => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      </section>

      <section className="space-y-6 pt-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-2">Pastas Personalizadas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.filter(f => !f.isSystem).map(folder => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-dashed border-slate-800 rounded-[32px] p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group"
          >
             <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-700 group-hover:text-purple-500 transition-colors">
                <i className="fas fa-plus"></i>
             </div>
             <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Criar Nova Pasta</p>
          </button>
        </div>
      </section>

      {/* Modal de Nova Pasta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 w-full max-w-md space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Nova Pasta</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <i className="fas fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nome da Pasta</label>
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ex: Trocas One Piece"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Jogo</label>
                <select 
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {dbGames.map(game => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={handleCreateBinder}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95"
            >
              Criar Pasta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FolderCard: React.FC<{ folder: Folder }> = ({ folder }) => (
  <div className="group bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 hover:border-purple-500/50 transition-all duration-300 cursor-pointer shadow-xl relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-32 h-32 ${folder.color} opacity-[0.03] rounded-full blur-3xl -mr-10 -mt-10`}></div>
    
    <div className="flex items-center space-x-5 mb-8">
       <div className={`w-14 h-14 rounded-2xl ${folder.color} flex items-center justify-center text-white text-xl shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
          <i className={`fas ${folder.icon}`}></i>
       </div>
       <div>
          <h4 className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1">{folder.name}</h4>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {folder.isSystem ? 'Principal' : folder.gameName || 'Personalizada'}
          </span>
       </div>
    </div>

    <div className="grid grid-cols-2 gap-4 border-t border-slate-800/50 pt-6">
       <div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Cartas</p>
          <p className="text-lg font-black text-slate-200">{folder.cardCount}</p>
       </div>
       <div className="text-right">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Valor Est.</p>
          <p className="text-lg font-black text-emerald-400">R$ {(folder.estimatedValue || 0).toFixed(2)}</p>
       </div>
    </div>
  </div>
);
