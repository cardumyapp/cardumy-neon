
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameType, Card } from '../types';
import { useAuth } from '../components/AuthProvider';
import { addCardToList, searchExternalCards, getBinders, addCardToBinder } from '../services/supabaseService';

interface Folder {
  id: string;
  name: string;
  color: string;
  listType: 'cards' | 'wishlist' | 'offerlist';
}

interface SearchProps {
  activeGame: GameType | 'All';
}

const DetailField: React.FC<{ 
  label: string; 
  value: string | number; 
  highlight?: string; 
  isCircle?: boolean;
  icon?: string;
}> = ({ label, value, highlight = 'text-white', isCircle, icon }) => (
  <div className="space-y-0.5">
    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    <div className="bg-slate-950/40 border border-white/5 rounded-lg px-2.5 py-1.5 flex items-center justify-between group hover:border-purple-500/30 transition-colors">
      <span className={`text-[11px] font-bold ${highlight} truncate`}>{value}</span>
      {isCircle ? (
        <span className="w-5 h-5 bg-emerald-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center shrink-0 ml-2">
          {value}
        </span>
      ) : icon ? (
        <i className={`${icon} text-slate-500 text-[10px] ml-2`}></i>
      ) : null}
    </div>
  </div>
);

export const Search: React.FC<SearchProps> = ({ activeGame }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [addingToFolder, setAddingToFolder] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCard, setExpandedCard] = useState<Card | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [userBinders, setUserBinders] = useState<any[]>([]);
  const itemsPerPage = 20;

  const fetchCards = useCallback(async (game: string, query: string, page: number) => {
    if (game === 'All') return;
    setLoading(true);
    const response = await searchExternalCards(game, query, page, itemsPerPage);
    setCards(response.data);
    setTotalPages(response.totalPages);
    setTotalResults(response.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = getBinders(user.id, (binders) => {
      setUserBinders(binders);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCards(activeGame, searchQuery, currentPage);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeGame, searchQuery, currentPage, fetchCards]);

  // Reset to page 1 when game or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeGame]);

  const systemFolders: Folder[] = [
    { id: 'colecao', name: 'Minha Coleção', color: 'bg-purple-500', listType: 'cards' },
    { id: 'offerlist', name: 'Para Troca', color: 'bg-blue-500', listType: 'offerlist' },
    { id: 'wishlist', name: 'Wishlist', color: 'bg-pink-500', listType: 'wishlist' },
  ];

  const [lastAdded, setLastAdded] = useState<{cardId: string, folderName: string} | null>(null);

  const handleAddToFolder = async (card: any, folder: any, isCustom: boolean = false) => {
    if (!user) return;
    setAddingToFolder(null);
    try {
      if (isCustom) {
        await addCardToBinder(user.id, folder.id, card);
      } else {
        await addCardToList(user.id, folder.listType, card);
      }
      setLastAdded({ cardId: card.id, folderName: folder.name });
      setTimeout(() => setLastAdded(null), 3000);
    } catch (err) {
      console.error('Error adding card:', err);
    }
  };

  // Se não houver um foco de jogo selecionado, solicita ao usuário (Igual ao Deckbuilder)
  if (activeGame === 'All') {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-slate-900/50 border border-slate-800 rounded-full flex items-center justify-center text-slate-700 shadow-2xl relative">
          <i className="fas fa-magnifying-glass text-4xl"></i>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center border-4 border-slate-950">
             <i className="fas fa-exclamation text-[10px] text-white"></i>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">O Cardume precisa de um Foco</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
            Para pesquisar cartas e ver preços, selecione uma franquia de TCG na barra lateral esquerda.
          </p>
        </div>
        <div className="flex space-x-2 opacity-20">
           <i className="fas fa-fish-fins text-slate-500"></i>
           <i className="fas fa-fish-fins text-slate-500"></i>
           <i className="fas fa-fish-fins text-slate-500"></i>
        </div>
      </div>
    );
  }

  // Filtragem respeitando o foco global (activeGame nunca será 'All' aqui)
  const paginatedCards = Array.isArray(cards) ? cards : [];

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      
      {/* Sidebar Filters - Desktop */}
      <aside className={`lg:w-72 flex-shrink-0 space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sticky top-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-500">Filtros Avançados</h3>
          </div>

          <div className="space-y-8">
            {/* Contexto Atual (Informativo) */}
            <div className="p-4 bg-purple-600/10 rounded-2xl border border-purple-500/20">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Explorando</p>
               <p className="text-xs font-bold text-white">{activeGame}</p>
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
              placeholder={`Pesquisar em ${activeGame}...`}
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
        <div className="flex items-center justify-between text-sm px-2">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-tight">
            <span className="text-white">{totalResults}</span> resultados encontrados em {activeGame}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Ordenar:</span>
            <select className="bg-transparent font-bold text-purple-400 outline-none cursor-pointer text-xs">
              <option>Relevância</option>
              <option>Preço: Menor p/ Maior</option>
              <option>Preço: Maior p/ Menor</option>
              <option>Data de Lançamento</option>
            </select>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm rounded-3xl">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {paginatedCards.map((card) => (
            <div key={card.id} className="group bg-slate-900/40 rounded-3xl border border-slate-800 hover:border-purple-500/50 transition-all duration-300 flex flex-col overflow-hidden relative shadow-lg">
              <div className="relative aspect-[3/4.2] p-2">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-800 relative shadow-2xl">
                  <motion.img 
                    layoutId={`card-img-${card.id}`}
                    src={card.imageUrl} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt={card.name} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCard(card);
                      }}
                      className="bg-white/10 backdrop-blur-md hover:bg-white/20 p-3 rounded-xl text-white transition-all"
                    >
                      <i className="fas fa-expand"></i>
                    </button>
                  </div>
                </div>
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-lg">
                  <span className="text-[10px] font-black text-emerald-400">R$ {(card.price || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="p-5 pt-2 flex-1 flex flex-col">
                <div className="mb-4">
                  <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors truncate text-sm" title={card.name}>
                    {card.name}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">{card.code}</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <span className="text-[10px] font-bold text-purple-500/80 uppercase">{card.game}</span>
                  </div>
                </div>

                {card.variants && card.variants.length > 0 && (
                  <div className="mb-4 bg-slate-950/40 rounded-xl p-2 border border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{card.variants.length} variantes</span>
                    <button className="text-[10px] font-black text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest">
                      Ver Preços
                    </button>
                  </div>
                )}

                <div className="mt-auto relative">
                  {addingToFolder === card.id ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-2xl p-2 border border-purple-500 shadow-2xl z-20 animate-in zoom-in-95 duration-200">
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-2 px-2">Escolha a pasta</p>
                      <div className="max-h-48 overflow-y-auto scrollbar-hide space-y-1">
                        {systemFolders.map(folder => (
                          <button 
                            key={folder.id}
                            onClick={() => handleAddToFolder(card, folder)}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-700 transition-colors flex items-center space-x-2"
                          >
                            <span className={`w-2 h-2 rounded-full ${folder.color}`}></span>
                            <span>{folder.name}</span>
                          </button>
                        ))}
                        {userBinders.length > 0 && <div className="h-px bg-slate-700 my-2 mx-2"></div>}
                        {userBinders.map(binder => (
                          <button 
                            key={binder.id}
                            onClick={() => handleAddToFolder(card, binder, true)}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-700 transition-colors flex items-center space-x-2"
                          >
                            <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                            <span className="truncate">{binder.name}</span>
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => setAddingToFolder(null)}
                        className="w-full text-center py-2 text-[10px] text-slate-500 hover:text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : lastAdded?.cardId === card.id ? (
                    <button className="w-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 py-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 animate-in fade-in">
                      <i className="fas fa-check"></i>
                      <span>Salvo em {lastAdded.folderName}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setAddingToFolder(card.id)}
                      className="w-full bg-slate-800 hover:bg-purple-600 text-white py-3 rounded-2xl text-xs font-bold transition-all border border-white/5 flex items-center justify-center space-x-2 group/btn active:scale-95 shadow-md"
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

          {paginatedCards.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
               <i className="fas fa-ghost text-4xl text-slate-800"></i>
               <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Nenhuma carta encontrada em {activeGame}</p>
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 pt-8">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:border-purple-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <i className="fas fa-chevron-left text-xs"></i>
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, array) => {
                  const isFirst = index === 0;
                  const prevPage = array[index - 1];
                  const showEllipsis = !isFirst && page - prevPage > 1;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="text-slate-600 px-1">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl border font-bold text-xs transition-all ${
                          currentPage === page 
                            ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:border-purple-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <i className="fas fa-chevron-right text-xs"></i>
            </button>
          </div>
        )}
      </div>

      {/* Expanded Card Modal */}
      <AnimatePresence>
        {expandedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedCard(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-slate-900 rounded-3xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-slate-900/50">
                <h3 className="text-sm font-black text-white uppercase tracking-tight">{expandedCard.name}</h3>
                <button 
                  onClick={() => setExpandedCard(null)}
                  className="w-8 h-8 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition-all"
                >
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>

              <div className="flex flex-col lg:flex-row overflow-hidden">
                {/* Left Section: Image & Marketplace Action */}
                <div className="lg:w-[300px] p-6 bg-slate-950/50 flex flex-col items-center justify-center space-y-6 border-r border-slate-800 shrink-0">
                  <div className="relative group w-full max-w-[240px]">
                    <motion.img 
                      layoutId={`card-img-${expandedCard.id}`}
                      src={expandedCard.imageUrl} 
                      className="w-full h-auto object-contain rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] group-hover:scale-[1.02] transition-transform duration-500" 
                      alt={expandedCard.name} 
                    />
                    <div className="absolute -top-3 -right-3 bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-lg font-black text-xs shadow-xl flex items-center space-x-1.5">
                       <i className="fas fa-tag"></i>
                       <span>R$ {(expandedCard.price || 0.81).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="w-full space-y-3">
                    <button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-[10px] tracking-widest py-3 rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95">
                      <i className="fas fa-shopping-cart"></i>
                      <span>Comprar</span>
                    </button>
                    <button 
                      onClick={() => {
                        handleAddToFolder(expandedCard, systemFolders[0]);
                        setExpandedCard(null);
                      }}
                      className="w-full bg-slate-800 hover:bg-purple-600 text-white font-black uppercase text-[9px] tracking-widest py-2.5 rounded-lg transition-all"
                    >
                      Adicionar à Coleção
                    </button>
                  </div>
                </div>

                {/* Right Section: Tech Detailed Stats */}
                <div className="flex-1 p-6 lg:p-8 space-y-6 bg-slate-900/30">
                  
                  {/* Top Stats Banner */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <div className="space-y-1">
                       <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                         {expandedCard.code} {expandedCard.name}
                       </h2>
                       <div className="flex items-center space-x-2">
                         <span className="px-2 py-0.5 bg-emerald-600/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20">
                           {expandedCard.game === 'One Piece' ? 'CHARACTER' : expandedCard.game === 'Yu-Gi-Oh!' ? 'MONSTER' : 'CARD'}
                         </span>
                         <span className="w-6 h-6 bg-emerald-500 text-slate-950 font-black rounded-full flex items-center justify-center text-xs">
                           5
                         </span>
                       </div>
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="space-y-6">
                    {/* Effect Section */}
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Efeito da Carta</h4>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          <span className="px-2 py-0.5 bg-orange-600 text-white text-[8px] font-black uppercase rounded-md">Banish</span>
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase rounded-md">Activate: Main</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                          <span className="text-orange-500 font-bold">(Banish)</span> Quando esta carta causa dano, a carta alvo é enviada para a lixeira sem ativar seus efeitos.
                          <br />
                          <span className="text-blue-500 font-bold">(Activate: Main)</span> Coloque até 1 de seus cartões DON!! como ativos. 
                        </p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <DetailField label="ID" value={expandedCard.code} />
                      <DetailField label="Preço" value={`R$ ${(expandedCard.price || 0.81).toFixed(2)}`} highlight="text-purple-400" />
                      <DetailField label="Custo" value="5" isCircle={true} />
                      <DetailField label="Cor" value="Green" />
                      <DetailField label="Raridade" value="Super Rare" highlight="text-orange-500" />
                      <DetailField label="Poder" value="7000" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Nav */}
              <div className="px-6 py-3 border-t border-white/5 bg-slate-950/80 flex items-center justify-between">
                <div className="bg-slate-800/50 px-3 py-1 rounded-full border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  11 / 16
                </div>
                <button className="bg-pink-600 hover:bg-pink-500 text-white font-black uppercase text-[9px] tracking-widest px-6 py-2 rounded-lg transition-all shadow-lg shadow-pink-600/20 active:scale-95 flex items-center space-x-2">
                  <i className="fas fa-chart-line text-[10px]"></i>
                  <span>Mais Detalhes</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
