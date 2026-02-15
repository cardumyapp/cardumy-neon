
import React, { useState } from 'react';

interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  cardCount: number;
  estimatedValue: number;
  isSystem?: boolean;
}

export const FoldersPage: React.FC = () => {
  const [folders] = useState<Folder[]>([
    { id: 'f1', name: 'Minha Coleção', icon: 'fa-box-archive', color: 'bg-purple-600', cardCount: 1248, estimatedValue: 3450.00, isSystem: true },
    { id: 'f2', name: 'Wishlist', icon: 'fa-heart', color: 'bg-pink-600', cardCount: 42, estimatedValue: 890.50, isSystem: true },
    { id: 'f3', name: 'Offerlist (Trocas)', icon: 'fa-right-left', color: 'bg-emerald-600', cardCount: 15, estimatedValue: 420.00, isSystem: true },
    { id: 'f4', name: 'Draft One Piece 2026', icon: 'fa-folder', color: 'bg-slate-800', cardCount: 60, estimatedValue: 120.00 },
    { id: 'f5', name: 'Staples Meta', icon: 'fa-folder', color: 'bg-slate-800', cardCount: 24, estimatedValue: 1200.00 },
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Suas Pastas</h2>
          <p className="text-slate-400">Organize sua coleção, metas de troca e listas de desejo.</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-black px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center space-x-3">
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
          <button className="border-2 border-dashed border-slate-800 rounded-[32px] p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group">
             <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-700 group-hover:text-purple-500 transition-colors">
                <i className="fas fa-plus"></i>
             </div>
             <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Criar Nova Pasta</p>
          </button>
        </div>
      </section>
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
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{folder.isSystem ? 'Principal' : 'Personalizada'}</span>
       </div>
    </div>

    <div className="grid grid-cols-2 gap-4 border-t border-slate-800/50 pt-6">
       <div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Cartas</p>
          <p className="text-lg font-black text-slate-200">{folder.cardCount}</p>
       </div>
       <div className="text-right">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Valor Est.</p>
          <p className="text-lg font-black text-emerald-400">R$ {folder.estimatedValue.toFixed(2)}</p>
       </div>
    </div>
  </div>
);
