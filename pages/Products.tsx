
import React, { useState, useMemo } from 'react';
import { MOCK_PRODUCTS } from '../constants';
import { ProductType, Product, GameType } from '../types';

interface ProductsProps {
  onAddToCart: (product: Product) => void;
  activeGame: GameType | 'All';
}

export const Products: React.FC<ProductsProps> = ({ onAddToCart, activeGame }) => {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [itemFilter, setItemFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Categorias para a coluna de Itens
  const itemCategories = ['Todos', 'Produto Selado', 'Acessório', 'Premium Bandai', 'Carta Avulsa'];

  // Filtragem Global por Jogo
  const scopedProducts = useMemo(() => {
    let list = MOCK_PRODUCTS;
    if (activeGame !== 'All') {
      list = list.filter(p => !p.game || p.game === activeGame);
    }
    if (searchQuery) {
      list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return list;
  }, [activeGame, searchQuery]);

  // Separação dos mundos: Ingressos vs Itens
  const tickets = useMemo(() => scopedProducts.filter(p => p.type === ProductType.TICKET), [scopedProducts]);
  const normalItems = useMemo(() => {
    let list = scopedProducts.filter(p => p.type !== ProductType.TICKET);
    if (itemFilter !== 'Todos') {
      // Mapeamento simples para o enum de ProductType se necessário
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
    return list;
  }, [scopedProducts, itemFilter]);

  // Detalhes da Oferta (Slug View)
  const productOffers = useMemo(() => {
    if (!selectedSlug) return [];
    return MOCK_PRODUCTS.filter(p => p.slug === selectedSlug);
  }, [selectedSlug]);

  const selectedBaseProduct = useMemo(() => productOffers[0] || null, [productOffers]);

  if (selectedSlug && selectedBaseProduct) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setSelectedSlug(null)}
          className="text-slate-500 hover:text-white flex items-center space-x-2 text-xs font-black uppercase tracking-widest transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          <span>Voltar para o Ecossistema</span>
        </button>

        <div className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-8 md:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="w-40 h-56 md:w-48 md:h-64 mx-auto relative">
             <img src={selectedBaseProduct.imageUrl} className="w-full h-full object-contain relative rounded-2xl shadow-2xl" alt={selectedBaseProduct.name} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl md:text-3xl font-black text-white tracking-tight uppercase leading-tight">{selectedBaseProduct.name}</h2>
            <div className="flex justify-center items-center space-x-3">
              <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{selectedBaseProduct.type}</span>
              {selectedBaseProduct.game && <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest">{selectedBaseProduct.game}</span>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">Lojas com Estoque</h3>
          <div className="space-y-3">
            {productOffers.map((offer) => (
              <OfferRow key={offer.id} offer={offer} onAddToCart={onAddToCart} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      
      {/* SEÇÃO DESTAQUE: ARENA DE INGRESSOS (HORIZONTAL / GRID LARGO) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <i className="fas fa-ticket-simple"></i>
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Arena Cardumy</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Torneios e Eventos de {activeGame === 'All' ? 'TCG' : activeGame}</p>
              </div>
           </div>
           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-950/30 px-3 py-1 rounded-full border border-indigo-500/10">{tickets.length} Eventos</span>
        </div>

        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map(ticket => (
              <div 
                key={ticket.id}
                onClick={() => setSelectedSlug(ticket.slug)}
                className="group relative bg-indigo-950/20 border border-indigo-500/20 rounded-[32px] p-6 flex flex-col gap-5 hover:border-indigo-400 hover:bg-indigo-900/30 transition-all cursor-pointer shadow-xl overflow-hidden"
              >
                {/* Visual Pass Style */}
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{ticket.game || 'TCG'}</span>
                      <h3 className="text-lg font-black text-white leading-tight uppercase group-hover:text-indigo-300 transition-colors line-clamp-2">{ticket.name}</h3>
                   </div>
                   <div className="bg-slate-900/80 px-2 py-2 rounded-xl border border-white/5 flex flex-col items-center min-w-[50px]">
                      <span className="text-[8px] font-black text-slate-500 uppercase">OUT</span>
                      <span className="text-lg font-black text-white">25</span>
                   </div>
                </div>

                <div className="flex items-center space-x-3 text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                   <i className="fas fa-shop text-indigo-500"></i>
                   <span className="truncate">{ticket.storeName}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-indigo-500/10">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-600 uppercase">Garantir Vaga</span>
                      <span className="text-xl font-black text-white">R$ {ticket.price.toFixed(2)}</span>
                   </div>
                   <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                     <i className="fas fa-arrow-right text-xs"></i>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-slate-900/20 rounded-[40px] border border-dashed border-slate-800 space-y-3 mx-2">
             <i className="fas fa-calendar-xmark text-3xl text-slate-800"></i>
             <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Sem eventos disponíveis para o foco selecionado</p>
          </div>
        )}
      </section>

      {/* DIVISOR FUNCIONAL: BUSCA E FILTROS */}
      <section className="sticky top-0 z-30 pt-4 pb-2 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row gap-4 items-center max-w-5xl mx-auto px-2">
          <div className="relative flex-1 w-full">
            <i className="fas fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input 
              type="text" 
              placeholder={`O que você busca no Marketplace de ${activeGame === 'All' ? 'Cardumy' : activeGame}?`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-purple-500 transition-all shadow-2xl placeholder:text-slate-600"
            />
          </div>
          
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-auto">
              {itemCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setItemFilter(cat)}
                  className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                    itemFilter === cat ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
          </div>
        </div>
      </section>

      {/* MARKETPLACE REGULAR: GRID DE PRODUTOS */}
      <section className="space-y-6 px-2">
         <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Marketplace Geral</h3>
            <span className="text-[9px] font-black text-slate-700 uppercase">{normalItems.length} Produtos</span>
         </div>

         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {normalItems.map(product => (
              <div 
                key={product.id} 
                onClick={() => setSelectedSlug(product.slug)}
                className="group bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:-translate-y-1 flex flex-col shadow-lg"
              >
                <div className="aspect-[3/4] p-4 bg-slate-950/20 relative flex items-center justify-center">
                  <img src={product.imageUrl} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                  {product.originalPrice && (
                    <div className="absolute top-2 right-2 bg-pink-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase shadow-lg">OFF</div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter truncate">{product.type}</p>
                    <h4 className="text-[10px] font-bold text-white leading-tight uppercase line-clamp-2 h-7 group-hover:text-purple-400 transition-colors">{product.name}</h4>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                    <span className="text-xs font-black text-emerald-400">R$ {product.price.toFixed(2)}</span>
                    <i className="fas fa-plus text-[9px] text-slate-700 group-hover:text-purple-500 transition-colors"></i>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State Marketplace */}
            {normalItems.length === 0 && (
              <div className="col-span-full py-24 text-center bg-slate-900/10 rounded-[40px] border border-dashed border-slate-800 space-y-3">
                 <i className="fas fa-box-open text-3xl text-slate-800"></i>
                 <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Nenhum produto regular encontrado</p>
              </div>
            )}
         </div>
      </section>
    </div>
  );
};

const OfferRow: React.FC<{ offer: Product; onAddToCart: (p: Product) => void }> = ({ offer, onAddToCart }) => {
  const [qty, setQty] = useState(1);

  return (
    <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 group">
      <div className="flex items-center space-x-4 w-full md:w-auto">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex-shrink-0">
           <img src={offer.storeLogo || `https://ui-avatars.com/api/?name=${offer.storeName}`} className="w-full h-full object-cover" alt={offer.storeName} />
        </div>
        <div>
          <h4 className="font-black text-white text-sm leading-none group-hover:text-purple-400 transition-colors">{offer.storeName}</h4>
          <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Lojista Parceiro</p>
        </div>
      </div>

      <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
        <div className="text-right">
           <p className="text-emerald-400 font-black text-lg leading-none">R$ {offer.price.toFixed(2)}</p>
           <p className="text-[9px] font-bold text-slate-600 uppercase mt-1">Qtd: {offer.stock || 0}</p>
        </div>

        <div className="flex items-center space-x-2">
          {offer.type !== ProductType.TICKET && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 h-10">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-6 h-full text-slate-600 hover:text-white transition-colors"><i className="fas fa-minus text-[10px]"></i></button>
              <span className="w-8 text-center text-xs font-black text-white">{qty}</span>
              <button onClick={() => setQty(q => Math.min(offer.stock || 99, q + 1))} className="w-6 h-full text-slate-600 hover:text-white transition-colors"><i className="fas fa-plus text-[10px]"></i></button>
            </div>
          )}

          <button 
            onClick={() => onAddToCart({ ...offer, price: offer.price, quantity: qty } as any)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95"
          >
            {offer.type === ProductType.TICKET ? 'Garantir Ingresso' : 'Comprar'}
          </button>
        </div>
      </div>
    </div>
  );
};
