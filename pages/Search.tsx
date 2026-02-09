
import React, { useState, useEffect } from 'react';
import { MOCK_CARDS } from '../constants';
import { GameType, Card } from '../types';

interface Folder {
  id: string;
  name: string;
  color: string;
}

interface SearchProps {
  activeGame: GameType | 'All';
}

export const Search: React.FC<SearchProps> = ({ activeGame }) => {
  const [selectedGame, setSelectedGame] = useState<GameType | 'All'>(activeGame);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingToFolder, setAddingToFolder] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Sync with global focus
  useEffect(() => {
    setSelectedGame(activeGame);
  }, [activeGame]);

  const folders: Folder[] = [
    { id: 'f1', name: 'Minha Coleção', color: 'bg-purple-500' },
    { id: 'f2', name: 'Para Troca', color: 'bg-blue-500' },
    { id: 'f3', name: 'Wishlist', color: 'bg-pink-500' },
  ];

  const [lastAdded, setLastAdded] = useState<{cardId: string, folderName: string} | null>(null);

  const handleAddToFolder = (cardId: string, folderName: string) => {
    setAddingToFolder(null);
    setLastAdded({ cardId, folderName });
    setTimeout(() => setLastAdded(null), 3000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      
      {/* Sidebar Filters - Desktop */}
      <aside className={`lg:w-72 flex-shrink-0 space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sticky top-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-500">Filtros Avançados</h3>
            <button className="text-purple-400 text-[10px] font-bold hover:underline" onClick={() => setSelectedGame('All')}>Limpar</button>
          </div>

          <div className="space-y-6">
            {/* Game Selector */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-300">Franquia</label>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => setSelectedGame('All')}
                  className={`text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                    selectedGame === 'All' 
                    ? 'bg-purple-600 border-purple-500 text-white' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Todas as Franquias
                </button>
                {Object.values(GameType).slice(0, 6).map(g => (
                  <button 
                    key={g}
                    onClick={() => setSelectedGame(g as GameType)}
                    className={`text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                      selectedGame === g 
                      ? 'bg-purple-600 border-purple-500 text-white' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Rarity */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-300">Raridade</label>
              <div className="flex flex-wrap gap-2">
                {['C', 'U', 'R', 'SR', 'SEC', 'P'].map(r => (
                  <button key={r} className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-black hover:border-purple-500 transition-colors">
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-300">Preço (R$)</label>
              <div className="flex items-center space-x-2">
                <input type="number" placeholder="Min" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-purple-500 outline-none" />
                <span className="text-slate-600">-</span>
                <input type="number" placeholder="Max" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-purple-500 outline-none" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        
        {/* Search Header */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <i className="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input 
              type="text" 
              placeholder={`Pesquisar em ${selectedGame === 'All' ? 'todas as franquias' : selectedGame}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-purple-500 transition-all shadow-xl"
            />
          </div>
          <button 
            className="lg:hidden bg-slate-800 p-4 rounded-2xl"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="fas fa-sliders"></i>
          </button>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-400">Mostrando <span className="text-white font-bold">20</span> de <span className="text-white font-bold">1.428</span> cartas encontradas</p>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 text-xs">Ordenar:</span>
            <select className="bg-transparent font-bold text-purple-400 outline-none cursor-pointer">
              <option>Relevância</option>
              <option>Preço: Menor p/ Maior</option>
              <option>Preço: Maior p/ Menor</option>
              <option>Data de Lançamento</option>
            </select>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {MOCK_CARDS.map((card) => (
            <div key={card.id} className="group bg-slate-900/40 rounded-3xl border border-slate-800 hover:border-purple-500/50 transition-all duration-300 flex flex-col overflow-hidden relative">
              <div className="relative aspect-[3/4.2] p-2">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-800 relative shadow-2xl">
                  <img 
                    src={card.imageUrl} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt={card.name} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 space-x-2">
                    <button className="bg-white/10 backdrop-blur-md hover:bg-white/20 p-3 rounded-xl text-white transition-all">
                      <i className="fas fa-expand"></i>
                    </button>
                    <button className="bg-white/10 backdrop-blur-md hover:bg-pink-600 p-3 rounded-xl text-white transition-all">
                      <i className="fas fa-heart"></i>
                    </button>
                  </div>
                </div>
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-lg">
                  <span className="text-[10px] font-black text-emerald-400">R$ {card.price?.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-5 pt-2 flex-1 flex flex-col">
                <div className="mb-4">
                  <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors truncate" title={card.name}>
                    {card.name}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">{card.code}</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <span className="text-[10px] font-bold text-purple-500/80 uppercase">{card.game}</span>
                  </div>
                </div>

                <div className="mt-auto relative">
                  {addingToFolder === card.id ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-2xl p-2 border border-purple-500 shadow-2xl z-20 animate-in zoom-in-95 duration-200">
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-2 px-2">Escolha a pasta</p>
                      <div className="space-y-1">
                        {folders.map(folder => (
                          <button 
                            key={folder.id}
                            onClick={() => handleAddToFolder(card.id, folder.name)}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-700 transition-colors flex items-center space-x-2"
                          >
                            <span className={`w-2 h-2 rounded-full ${folder.color}`}></span>
                            <span>{folder.name}</span>
                          </button>
                        ))}
                        <button 
                          onClick={() => setAddingToFolder(null)}
                          className="w-full text-center py-2 text-[10px] text-slate-500 hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : lastAdded?.cardId === card.id ? (
                    <button className="w-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 py-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 animate-in fade-in">
                      <i className="fas fa-check"></i>
                      <span>Salvo em {lastAdded.folderName}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setAddingToFolder(card.id)}
                      className="w-full bg-slate-800 hover:bg-purple-600 text-white py-3 rounded-2xl text-xs font-bold transition-all border border-white/5 flex items-center justify-center space-x-2 group/btn active:scale-95"
                    >
                      <i className="fas fa-folder-plus text-slate-400 group-hover/btn:text-white transition-colors"></i>
                      <span>Adicionar à Pasta</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-800/50 bg-slate-950/30">
                <p className="text-[9px] text-slate-500 truncate italic">
                  {card.set}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
