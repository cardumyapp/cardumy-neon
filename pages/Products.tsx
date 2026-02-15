
import React, { useState, useMemo } from 'react';
import { MOCK_PRODUCTS } from '../constants';
import { ProductType, Product, GameType } from '../types';

interface ProductsProps {
  onAddToCart: (product: Product) => void;
  activeGame: GameType | 'All';
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'relevance';

export const Products: React.FC<ProductsProps> = ({ onAddToCart, activeGame }) => {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [itemFilter, setItemFilter] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [searchQuery, setSearchQuery] = useState('');

  const itemCategories = ['Todos', 'Produto Selado', 'Acessório', 'Premium Bandai', 'Carta Avulsa'];

  const scopedProducts = useMemo(() => {
    let list = [...MOCK_PRODUCTS];
    if (activeGame !== 'All') {
      list = list.filter(p => !p.game || p.game === activeGame);
    }
    if (searchQuery) {
      list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return list;
  }, [activeGame, searchQuery]);

  const tickets = useMemo(() => scopedProducts.filter(p => p.type === ProductType.TICKET), [scopedProducts]);
  
  const normalItems = useMemo(() => {
    let list = scopedProducts.filter(p => p.type !== ProductType.TICKET);
    
    if (itemFilter !== 'Todos') {
      const filterToType: Record<string, ProductType> = {
        'Produto Selado': ProductType.BOOSTER,
        'Acessório': ProductType.ACCESSORY,
        'Premium Bandai': ProductType.PREMIUM_BANDAI,
        'Carta Avulsa': ProductType.CARD
      };
      const targetType = filterToType[itemFilter];
      if (targetType) {
        list = list.filter(p => p.type === targetType || (itemFilter === 'Produto Selado' && p.type === ProductType.STARTER_DECK));
      }
    }

    return list.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return 0;
    });
  }, [scopedProducts, itemFilter, sortBy]);

  const productOffers = useMemo(() => {
    if (!selectedSlug) return [];
    return MOCK_PRODUCTS.filter(p => p.slug === selectedSlug);
  }, [selectedSlug]);

  const selectedBaseProduct = useMemo(() => productOffers[0] || null, [productOffers]);

  if (selectedSlug && selectedBaseProduct) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <button onClick={() => setSelectedSlug(null)} className="text-slate-500 hover:text-white flex items-center space-x-2 text-xs font-black uppercase tracking-widest">
          <i className="fas fa-arrow-left"></i>
          <span>Voltar</span>
        </button>
        <div className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-12 text-center space-y-6 shadow-2xl">
          <div className="w-48 h-64 mx-auto">
             <img src={selectedBaseProduct.imageUrl} className="w-full h-full object-contain rounded-2xl" alt={selectedBaseProduct.name} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase">{selectedBaseProduct.name}</h2>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">Ofertas Disponíveis</h3>
          {productOffers.map((offer) => (
            <OfferRow key={offer.id} offer={offer} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
      
      {/* SEÇÃO DESTAQUE: INGRESSOS */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3 px-2">
           <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
             <i className="fas fa-ticket-simple"></i>
           </div>
           <div>
             <h2 className="text-2xl font-black text-white uppercase tracking-tight">Arena Cardumy</h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ingressos para Torneios de {activeGame === 'All' ? 'TCG' : activeGame}</p>
           </div>
        </div>

        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tickets.map(ticket => (
              <div key={ticket.id} onClick={() => setSelectedSlug(ticket.slug)} className="group bg-indigo-950/20 border border-indigo-500/20 rounded-[32px] p-6 hover:border-indigo-400 transition-all cursor-pointer shadow-xl overflow-hidden relative">
                <div className="flex justify-between items-start mb-4">
                   <h3 className="text-lg font-black text-white leading-tight uppercase line-clamp-2">{ticket.name}</h3>
                   <div className="bg-slate-950/80 px-2 py-2 rounded-xl border border-white/5 flex flex-col items-center">
                      <span className="text-[10px] font-black text-white">25</span>
                      <span className="text-[8px] font-black text-slate-500 uppercase">VAGAS</span>
                   </div>
                </div>
                <div className="flex items-center justify-between mt-auto">
                   <span className="text-xl font-black text-white">R$ {ticket.price.toFixed(2)}</span>
                   <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                     <i className="fas fa-arrow-right text-xs"></i>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-slate-900/20 rounded-[40px] border border-dashed border-slate-800 mx-2">
             <p className="text-slate-600 font-bold uppercase text-xs">Sem eventos para o foco selecionado</p>
          </div>
        )}
      </section>

      {/* MARKETPLACE LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar de Filtros (Desktop) */}
        <aside className="lg:w-64 space-y-8 flex-shrink-0">
          <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Categoria</label>
              <div className="space-y-2">
                {itemCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setItemFilter(cat)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                      itemFilter === cat ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ordenar Por</label>
              <div className="space-y-2">
                {[
                  { id: 'relevance', label: 'Relevância' },
                  { id: 'price_asc', label: 'Menor Preço' },
                  { id: 'price_desc', label: 'Maior Preço' }
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => setSortBy(opt.id as SortOption)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                      sortBy === opt.id ? 'bg-slate-800 border-purple-500 text-purple-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
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
        <div className="flex-1 space-y-6">
           <div className="relative">
              <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"></i>
              <input 
                type="text" 
                placeholder="Pesquisar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-purple-500 transition-all shadow-xl"
              />
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
              {normalItems.map(product => (
                <div key={product.id} onClick={() => setSelectedSlug(product.slug)} className="group bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:-translate-y-1 cursor-pointer flex flex-col shadow-lg">
                  <div className="aspect-[3/4] p-4 bg-slate-950/20 relative flex items-center justify-center">
                    <img src={product.imageUrl} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[8px] font-black text-slate-600 uppercase mb-1">{product.type}</p>
                      <h4 className="text-[10px] font-bold text-white uppercase line-clamp-2 h-7 group-hover:text-purple-400 transition-colors">{product.name}</h4>
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-sm font-black text-emerald-400">R$ {product.price.toFixed(2)}</span>
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-purple-600 group-hover:text-white transition-all">
                        <i className="fas fa-plus text-[10px]"></i>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const OfferRow: React.FC<{ offer: Product; onAddToCart: (p: Product) => void }> = ({ offer, onAddToCart }) => {
  const [qty, setQty] = useState(1);
  return (
    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 group">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
           <img src={offer.storeLogo || `https://ui-avatars.com/api/?name=${offer.storeName}`} className="w-full h-full object-cover" alt={offer.storeName} />
        </div>
        <div>
          <h4 className="font-black text-white text-sm group-hover:text-purple-400">{offer.storeName}</h4>
          <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Lojista Parceiro</p>
        </div>
      </div>
      <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
        <span className="text-xl font-black text-emerald-400">R$ {offer.price.toFixed(2)}</span>
        <button 
          onClick={() => onAddToCart({ ...offer, quantity: qty } as any)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase px-8 py-3.5 rounded-xl transition-all shadow-lg active:scale-95"
        >
          {offer.type === ProductType.TICKET ? 'Garantir Vaga' : 'Comprar'}
        </button>
      </div>
    </div>
  );
};
