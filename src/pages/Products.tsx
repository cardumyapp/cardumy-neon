import React, { useState, useMemo, useEffect } from 'react';
import { getProducts, getCardgames, getProductTypes, updateStoreStock } from '../services/supabaseService';
import { ProductType, Product, GameType } from '../types';
import { useAuth } from '../components/AuthProvider';
import { useNotification } from '../components/NotificationProvider';
import { OfflineWarning } from '../components/OfflineWarning';
import { motion, AnimatePresence } from 'motion/react';

interface ProductsProps {
  onAddToCart: (product: Product) => void;
  activeGame: GameType | 'All';
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'relevance';

export const Products: React.FC<ProductsProps> = ({ onAddToCart, activeGame }) => {
  const { isOffline, user } = useAuth();
  const { showNotification } = useNotification();
  const isLojista = user?.role_id === 6;
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [dbGames, setDbGames] = useState<any[]>([]);
  const [dbProductTypes, setDbProductTypes] = useState<any[]>([]);
  const [gameFilterId, setGameFilterId] = useState<string | number>('all');
  const [typeFilterId, setTypeFilterId] = useState<string | number>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [store, setStore] = useState<any>(null);
  const itemsPerPage = 12;

  useEffect(() => {
    if (isLojista && user?.username) {
        fetch(`/api/lojas/${user.username}`)
            .then(r => r.json())
            .then(d => setStore(d.store))
            .catch(e => console.error("Error fetching store:", e));
    }
  }, [isLojista, user?.username]);

  const handleAddToStock = async (product: any) => {
    if (!store?.id) {
        showNotification("Loja não encontrada para sua conta.", "error");
        return;
    }

    try {
        const res = await updateStoreStock(store.id, product.id, 1, product.price || 0, false);
        if (res && res.status === 'ok') {
            showNotification(`${product.name} adicionado ao seu estoque!`, "success");
        } else {
            throw new Error("Falha ao atualizar estoque");
        }
    } catch (err: any) {
        showNotification(err.message, "error");
    }
  };

  // Filter product types based on the selected game
  const visibleProductTypes = useMemo(() => {
    if (gameFilterId === 'all') {
      return dbProductTypes.filter(type => !type.game_id);
    }
    return dbProductTypes.filter(type => !type.game_id || type.game_id?.toString() === gameFilterId.toString());
  }, [dbProductTypes, gameFilterId]);

  useEffect(() => {
    const unsub = getProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    
    const fetchMetadata = async () => {
      const [games, types] = await Promise.all([
        getCardgames(),
        getProductTypes()
      ]);
      setDbGames(games);
      setDbProductTypes(types);
    };
    
    fetchMetadata();
    return () => unsub();
  }, []);

  // Sync game filter with activeGame prop
  useEffect(() => {
    if (activeGame !== 'All' && dbGames.length > 0) {
      const game = dbGames.find(g => g.name === activeGame);
      if (game) setGameFilterId(game.id);
    } else if (activeGame === 'All') {
      setGameFilterId('all');
    }
  }, [activeGame, dbGames]);

  const mappedProducts = useMemo(() => {
    return products.map(p => {
      const gameData = Array.isArray(p.cardgames) ? p.cardgames[0] : p.cardgames;
      const typeData = Array.isArray(p.product_types) ? p.product_types[0] : p.product_types;
      const isTicket = typeData?.name === 'Ingresso';
      
      let stock = 0;
      let price = p.msrp || p.mspr || p.price || 0;

      if (isTicket) {
        const ticketInfo = Array.isArray(p.tournament_tickets) ? p.tournament_tickets[0] : p.tournament_tickets;
        if (ticketInfo) {
          stock = (ticketInfo.max_quantity || 0) - (ticketInfo.sold_quantity || 0);
        }
      } else {
        const stockItems = Array.isArray(p.store_stock) ? p.store_stock : [];
        stock = stockItems.reduce((acc: number, curr: any) => acc + (curr.quantity || 0), 0);
        // If multiple stores have the item, we show the lowest price if not ticket
        if (stockItems.length > 0) {
          price = Math.min(...stockItems.map((si: any) => si.store_price || p.msrp || p.mspr || 0));
        }
      }
      
      return {
        ...p,
        imageUrl: p.image_url || p.imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400',
        name: p.beauty_name || p.name,
        price,
        stock,
        type: typeData?.name || p.product_type || p.type,
        game: gameData?.name || p.game || 'TCG',
        game_id: p.game_id || gameData?.id
      };
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...mappedProducts];
    
    // Filter by Game
    if (gameFilterId !== 'all') {
      const targetId = gameFilterId.toString();
      list = list.filter(p => {
        const gameIdValue = p.game_id?.toString();
        return gameIdValue === targetId;
      });
    }
    
    // Filter by Type
    if (typeFilterId !== 'all') {
      list = list.filter(p => p.product_type_id?.toString() === typeFilterId.toString());
    }

    if (searchQuery) {
      list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return list.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return 0;
    });
  }, [mappedProducts, gameFilterId, typeFilterId, searchQuery, sortBy]);

  const tickets = useMemo(() => filteredProducts.filter(p => p.type === 'Ingresso'), [filteredProducts]);
  const normalItems = useMemo(() => filteredProducts.filter(p => p.type !== 'Ingresso'), [filteredProducts]);

  const totalPages = Math.ceil(normalItems.length / itemsPerPage);
  
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return normalItems.slice(startIndex, startIndex + itemsPerPage);
  }, [normalItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [gameFilterId, typeFilterId, searchQuery, sortBy, activeGame]);

  // Reset type filter if it becomes invalid for the current game
  useEffect(() => {
    if (typeFilterId !== 'all' && visibleProductTypes.length > 0) {
      const isStillVisible = visibleProductTypes.some(t => t.id.toString() === typeFilterId.toString());
      if (!isStillVisible) {
        setTypeFilterId('all');
      }
    }
  }, [visibleProductTypes, typeFilterId]);

  const selectedProduct = useMemo(() => {
    if (!selectedSlug) return null;
    const base = products.find(p => p.slug === selectedSlug);
    if (!base) return null;

    const gameData = Array.isArray(base.cardgames) ? base.cardgames[0] : base.cardgames;
    const typeData = Array.isArray(base.product_types) ? base.product_types[0] : base.product_types;

    return {
      ...base,
      imageUrl: base.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400',
      name: base.beauty_name || base.name,
      game: gameData?.name || 'TCG',
      type: typeData?.name || 'Produto'
    };
  }, [selectedSlug, products]);

  const offers = useMemo(() => {
    if (!selectedProduct) return [];
    const stockItems = Array.isArray(selectedProduct.store_stock) ? selectedProduct.store_stock : [];
    
    return stockItems.map((si: any) => ({
      id: si.id,
      storeId: si.stores?.id,
      storeName: si.stores?.name,
      storeLogo: si.stores?.logo,
      storeSlug: si.stores?.slug,
      isOfficialPartner: si.stores?.parceiro,
      stock: si.quantity,
      price: si.store_price || selectedProduct.msrp || selectedProduct.mspr || 0,
      type: selectedProduct.type,
      product: selectedProduct // Carry the product info for addToCart
    }));
  }, [selectedProduct]);

  if (selectedSlug && selectedProduct) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8 pb-20 px-4"
      >
        <button onClick={() => setSelectedSlug(null)} className="group text-slate-500 hover:text-white flex items-center space-x-2 text-xs font-black uppercase tracking-widest transition-colors">
          <i className="fas fa-arrow-left transition-transform group-hover:-translate-x-1"></i>
          <span>Voltar para Loja</span>
        </button>
        
        <div className="bg-slate-900/60 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent pointer-events-none"></div>
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="w-full md:w-64 aspect-[3/4] flex-shrink-0">
               <motion.img 
                layoutId={`img-${selectedProduct.slug}`}
                src={selectedProduct.imageUrl} 
                className="w-full h-full object-contain rounded-2xl drop-shadow-[0_20px_50px_rgba(139,92,246,0.3)]" 
                alt={selectedProduct.name} 
               />
            </div>
            <div className="flex-1 text-center md:text-left space-y-4">
              <span className="inline-block px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black text-purple-400 uppercase tracking-widest">
                {selectedProduct.game}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase leading-tight">{selectedProduct.name}</h2>
              
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {selectedProduct.type}
                </span>
                {selectedProduct.release_date && (
                   <span className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                     Lançamento: {new Date(selectedProduct.release_date).toLocaleDateString('pt-BR')}
                   </span>
                )}
                {selectedProduct.msrp && (
                   <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                     MSRP: R$ {Number(selectedProduct.msrp || selectedProduct.mspr || 0).toFixed(2)}
                   </span>
                )}
              </div>

              {selectedProduct.description && (
                <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                  {selectedProduct.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Ofertas Disponíveis</h3>
            {isLojista && (
                <button 
                  onClick={() => handleAddToStock(selectedProduct)}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-purple-600/20"
                >
                  Adicionar ao meu estoque
                </button>
            )}
            <span className="text-[10px] font-bold text-slate-600 uppercase">{offers.length} {offers.length === 1 ? 'vendedor' : 'vendedores'}</span>
          </div>
          <div className="space-y-3">
            {offers.length > 0 ? (
              offers.map((offer: any, idx: number) => (
                <OfferRow key={offer.id || `offer-${idx}`} offer={offer} onAddToCart={onAddToCart} isLojista={isLojista} />
              ))
            ) : (
                <div className="bg-slate-900/40 border border-slate-800 p-12 rounded-[32px] text-center space-y-3">
                   <i className="fas fa-store-slash text-slate-700 text-3xl"></i>
                   <p className="text-xs font-bold text-slate-500 uppercase">Nenhuma loja com estoque disponível no momento.</p>
                </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4 sm:px-6">
      {isOffline && <OfflineWarning />}

      {/* MARKETPLACE LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
           <div className="flex flex-col">
             <span className="text-[10px] font-black text-slate-500 uppercase">Filtros Ativos</span>
             <span className="text-xs font-bold text-white uppercase">{normalItems.length} Produtos</span>
           </div>
           <button 
             onClick={() => setIsFilterOpen(!isFilterOpen)}
             className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2"
           >
             <i className={`fas ${isFilterOpen ? 'fa-times' : 'fa-sliders-h'}`}></i>
             <span>{isFilterOpen ? 'Fechar' : 'Filtrar'}</span>
           </button>
        </div>

        {/* Sidebar de Filtros (Desktop + Mobile Toggle) */}
        <aside className={`lg:w-64 flex-shrink-0 transition-all ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-6 bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 space-y-10 shadow-xl">
            
            {/* FILTRO: GÊNERO */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 px-1">
                <i className="fas fa-shapes text-purple-500 text-[10px]"></i>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gênero</label>
              </div>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                <FilterButton 
                  isActive={typeFilterId === 'all'} 
                  onClick={() => setTypeFilterId('all')} 
                  label="Todos" 
                />
                {visibleProductTypes.map((type, idx) => (
                  <FilterButton 
                    key={type.id || `type-${idx}`}
                    isActive={typeFilterId === type.id}
                    onClick={() => setTypeFilterId(type.id)}
                    label={type.name}
                  />
                ))}
              </div>
            </div>

            {/* FILTRO: FRANQUIA */}
            {activeGame === 'All' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 px-1">
                  <i className="fas fa-gamepad text-indigo-500 text-[10px]"></i>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Franquia</label>
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  <FilterButton 
                    isActive={gameFilterId === 'all'} 
                    onClick={() => setGameFilterId('all')} 
                    label="Todas as Ligas" 
                    colorClass="bg-indigo-600 border-indigo-500"
                  />
                  {dbGames.map((game, idx) => (
                    <FilterButton 
                      key={game.id || `game-${idx}`}
                      isActive={gameFilterId.toString() === game.id.toString()}
                      onClick={() => setGameFilterId(game.id)}
                      label={game.name}
                      colorClass="bg-indigo-600 border-indigo-500"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* FILTRO: ORDENAÇÃO */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 px-1">
                <i className="fas fa-sort-amount-down text-emerald-500 text-[10px]"></i>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Classificar</label>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'relevance', label: 'Em Destaque' },
                  { id: 'newest', label: 'Novos Lotes' },
                  { id: 'price_asc', label: 'Preço: Menor' },
                  { id: 'price_desc', label: 'Preço: Maior' }
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => setSortBy(opt.id as SortOption)}
                    className={`text-left px-4 py-3 rounded-xl text-[11px] font-bold transition-all border ${
                      sortBy === opt.id ? 'bg-slate-800 border-emerald-500/50 text-emerald-400' : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Grid de Itens */}
        <div className="flex-1 space-y-8">
           <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                 <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-colors"></i>
                 <input 
                   type="text" 
                   placeholder="Procure por box, boosters, kits..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:outline-none focus:border-purple-500 transition-all shadow-xl placeholder:text-slate-600"
                 />
              </div>
              <div className="hidden sm:flex items-center px-6 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                   {normalItems.length} <span className="text-slate-700">resultados</span>
                 </span>
              </div>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-slate-900/40 border border-slate-800 rounded-[32px] animate-pulse"></div>
                ))
              ) : (
                   <AnimatePresence mode="popLayout">
                   {paginatedItems.map((product, idx) => (
                     <motion.div 
                       layout
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.9 }}
                       key={product.id || `prod-${idx}`} 
                       onClick={() => setSelectedSlug(product.slug)} 
                       className="group bg-slate-900/40 border border-slate-800 rounded-[32px] overflow-hidden transition-all duration-500 hover:border-purple-500/50 hover:-translate-y-2 cursor-pointer flex flex-col shadow-lg"
                     >
                      <div className="aspect-square p-6 bg-slate-950/20 relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <img 
                          src={product.imageUrl} 
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out" 
                          alt={product.name} 
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{product.game || 'TCG'}</span>
                            <span className="text-[8px] font-bold text-slate-700 uppercase">{product.type}</span>
                          </div>
                          <h4 className="text-[11px] font-black text-white uppercase line-clamp-2 h-9 group-hover:text-purple-400 transition-colors leading-relaxed">{product.name}</h4>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-600 uppercase">A partir de</span>
                            <span className="text-sm font-black text-emerald-400">R$ {(product.price || 0).toFixed(2)}</span>
                          </div>
                          <div 
                            onClick={(e) => {
                                if (isLojista) {
                                    e.stopPropagation();
                                    handleAddToStock(product);
                                }
                            }}
                            className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-inner group-hover:rotate-90"
                          >
                            <i className={`fas ${isLojista ? 'fa-box-archive' : 'fa-plus'} text-[10px]`}></i>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              {!loading && paginatedItems.length === 0 && (
                <div className="col-span-full py-32 text-center space-y-6">
                  <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-700">
                    <i className="fas fa-box-open text-3xl"></i>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-white uppercase tracking-[0.1em]">Nenhum tesouro encontrado</p>
                    <p className="text-[10px] text-slate-500 font-bold">Tente ajustar seus filtros para descobrir novos produtos.</p>
                  </div>
                  <button 
                    onClick={() => { setTypeFilterId('all'); setGameFilterId('all'); setSearchQuery(''); }}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase transition-colors"
                  >
                    Resetar Filtros
                  </button>
                </div>
              )}
           </div>

           {/* Paginação */}
           {totalPages > 1 && (
             <div className="flex items-center justify-center space-x-2 pt-12">
               <button
                 disabled={currentPage === 1}
                 onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                 className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:border-purple-500 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-lg"
               >
                 <i className="fas fa-chevron-left text-xs"></i>
               </button>
               
               <div className="flex items-center space-x-1.5 px-3">
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
                         {showEllipsis && <span className="text-slate-600 font-black px-1 pb-1">...</span>}
                         <button
                           onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                           className={`w-11 h-11 rounded-2xl border font-black text-xs transition-all shadow-md ${
                             currentPage === page 
                               ? 'bg-purple-600 border-purple-500 text-white shadow-[0_10px_20px_-5px_rgba(139,92,246,0.3)] scale-110 z-10' 
                               : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
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
                 onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                 className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:border-purple-500 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-lg"
               >
                 <i className="fas fa-chevron-right text-xs"></i>
               </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const FilterButton: React.FC<{ isActive: boolean; onClick: () => void; label: string; colorClass?: string }> = ({ isActive, onClick, label, colorClass = 'bg-purple-600 border-purple-500' }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
      isActive ? `${colorClass} text-white shadow-lg scale-[1.02]` : 'bg-slate-950/40 border-slate-800/80 text-slate-500 hover:border-slate-700 hover:text-slate-300'
    }`}
  >
    {label}
  </button>
);

const OfferRow: React.FC<{ offer: Product; onAddToCart: (p: Product) => void; isLojista: boolean }> = ({ offer, onAddToCart, isLojista }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-900/40 border border-slate-800 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-slate-700 transition-colors shadow-xl"
    >
      <div className="flex items-center space-x-5">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner p-1">
           <img src={offer.storeLogo || `https://ui-avatars.com/api/?name=${offer.storeName || 'Store'}`} className="w-full h-full object-cover rounded-xl" alt={offer.storeName} />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <h4 className="font-black text-white text-base group-hover:text-purple-400 transition-colors uppercase tracking-tight">{offer.storeName || 'Lojista Cardumy'}</h4>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{offer.stock || 0} em estoque</span>
            <span className="text-slate-800 text-[10px]">|</span>
            <p className="text-[9px] font-bold text-slate-500 uppercase">Envio para todo Brasil</p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800/50 pt-4 md:pt-0">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Preço Unitário</span>
          <span className="text-2xl font-black text-emerald-400">R$ {(offer.price || 0).toFixed(2)}</span>
        </div>
        {!isLojista && (
          <button 
            onClick={() => onAddToCart({ ...offer, quantity: 1 } as any)}
            disabled={offer.stock === 0}
            className={`px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
              offer.stock === 0 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_10px_25px_-5px_rgba(139,92,246,0.3)]'
            }`}
          >
            {offer.stock === 0 ? 'Esgotado' : (offer.type === 'Ingresso' ? 'Garantir Vaga' : 'Adicionar')}
          </button>
        )}
      </div>
    </motion.div>
  );
};
