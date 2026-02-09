
import React, { useState, useMemo } from 'react';
import { MOCK_PRODUCTS } from '../constants';
import { ProductType, Product, GameType } from '../types';

interface MarketplaceProps {
  onAddToCart: (product: Product) => void;
  activeGame: GameType | 'All';
}

export const Marketplace: React.FC<MarketplaceProps> = ({ onAddToCart, activeGame }) => {
  const [activeCategory, setActiveCategory] = useState<string>('Tudo');
  
  const categories = ['Tudo', 'Produto Selado', 'Acessório', 'Ingresso', 'Promoção'];

  const filteredProducts = useMemo(() => {
    let list = MOCK_PRODUCTS;
    
    // Global Focus Filter
    if (activeGame !== 'All') {
      list = list.filter(p => !p.game || p.game === activeGame);
    }
    
    // Category Filter
    if (activeCategory !== 'Tudo') {
      list = list.filter(p => p.type === activeCategory);
    }
    
    return list;
  }, [activeGame, activeCategory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Dynamic Focus Header */}
      {activeGame !== 'All' && (
        <div className="bg-purple-600 border border-purple-500/50 p-6 rounded-3xl flex items-center justify-between shadow-lg shadow-purple-600/10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white text-xl">
               {/* Fixed: activeGame is already narrowed to not be 'All' here, so we use the specific icon directly to avoid TS error */}
               <i className="fas fa-filter"></i>
            </div>
            <div>
              <h3 className="text-xl font-black text-white leading-none mb-1">Mercado {activeGame}</h3>
              <p className="text-xs text-purple-100 font-medium">Exibindo apenas ofertas para sua franquia em foco.</p>
            </div>
          </div>
          <div className="bg-slate-950/20 px-4 py-2 rounded-xl border border-white/10">
             <span className="text-[10px] font-black text-white uppercase tracking-widest">{filteredProducts.length} itens encontrados</span>
          </div>
        </div>
      )}

      {/* Promo Header (Only if all games or relevant to focus) */}
      {activeGame === 'All' && (
        <div className="relative h-64 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-transparent z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=1200" 
            className="absolute inset-0 w-full h-full object-cover opacity-40" 
            alt="Banner Marketplace"
          />
          <div className="relative z-20 h-full flex flex-col justify-center px-12 max-w-2xl space-y-4">
            <div className="inline-flex bg-pink-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest self-start">
              Oferta da Semana
            </div>
            <h2 className="text-4xl font-black text-white">Boosters com até 30% OFF</h2>
            <p className="text-slate-300">Encontre os melhores produtos selados das lojas parceiras Cardumy com preços exclusivos para membros.</p>
            <button className="bg-white text-slate-950 font-black px-6 py-3 rounded-xl self-start hover:bg-purple-400 transition-colors active:scale-95 shadow-lg shadow-white/5">
              Aproveitar Agora
            </button>
          </div>
        </div>
      )}

      {/* Categories & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat 
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
          <input 
            type="text" 
            placeholder="Buscar no marketplace..." 
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.length > 0 ? filteredProducts.map(product => (
          <div key={product.id} className="group bg-slate-900/40 rounded-3xl border border-slate-800 hover:border-purple-500/50 transition-all duration-300 flex flex-col overflow-hidden relative">
            <div className="p-4 bg-slate-950/50 flex items-center justify-between border-b border-slate-800/50">
               <div className="flex items-center space-x-2">
                 <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                    <i className="fas fa-shop text-[10px] text-purple-400"></i>
                 </div>
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider truncate max-w-[120px]">{product.storeName}</span>
               </div>
               {product.isOfficialPartner && (
                 <i className="fas fa-circle-check text-blue-400 text-[10px]" title="Parceiro Oficial"></i>
               )}
            </div>

            <div className="aspect-square relative overflow-hidden p-4">
              <img 
                src={product.imageUrl} 
                className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-700" 
                alt={product.name} 
              />
              {product.type === ProductType.TICKET && (
                <div className="absolute top-6 right-6 bg-yellow-500 text-slate-950 font-black px-3 py-1 rounded-full text-[9px] uppercase tracking-widest shadow-xl">
                  Evento
                </div>
              )}
              {product.originalPrice && (
                <div className="absolute top-6 left-6 bg-pink-600 text-white font-black px-3 py-1 rounded-full text-[9px] uppercase tracking-widest shadow-xl">
                  PROMO
                </div>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{product.type}</span>
              <h4 className="font-bold text-white mb-4 line-clamp-2 group-hover:text-purple-400 transition-colors leading-snug h-10">{product.name}</h4>
              
              <div className="mt-auto space-y-4">
                <div className="flex items-end space-x-2">
                  <div className="flex flex-col">
                    {product.originalPrice && (
                      <span className="text-xs text-slate-600 line-through">R$ {product.originalPrice.toFixed(2)}</span>
                    )}
                    <span className="text-xl font-black text-emerald-400">R$ {product.price.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => onAddToCart(product)}
                  className="w-full bg-slate-800 hover:bg-purple-600 text-white font-bold py-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center space-x-2 border border-white/5"
                >
                  <i className="fas fa-cart-plus text-xs"></i>
                  <span className="text-xs">Comprar</span>
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-24 text-center space-y-4">
             <i className="fas fa-search text-4xl text-slate-800"></i>
             <p className="text-slate-500">Nenhum produto de <span className="text-white font-bold">{activeGame}</span> encontrado nesta categoria.</p>
             <button onClick={() => setActiveCategory('Tudo')} className="text-purple-400 font-bold hover:underline">Ver todas as categorias</button>
          </div>
        )}

        <div className="border-2 border-dashed border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all">
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-600">
            <i className="fas fa-shop text-2xl"></i>
          </div>
          <h4 className="font-bold text-slate-200">Sua Loja aqui!</h4>
          <p className="text-xs text-slate-500">Venda cartas, produtos e ingressos para a maior comunidade de TCG.</p>
          <button className="text-purple-400 text-xs font-bold hover:underline">Começar agora →</button>
        </div>
      </div>
    </div>
  );
};
