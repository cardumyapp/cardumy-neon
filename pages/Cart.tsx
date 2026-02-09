
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CartItem } from '../types';

interface CartPageProps {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ cart, updateQuantity, removeFromCart }) => {
  const groupedByStore = useMemo(() => {
    return cart.reduce((acc, item) => {
      if (!acc[item.storeId]) {
        acc[item.storeId] = {
          storeName: item.storeName,
          items: []
        };
      }
      acc[item.storeId].items.push(item);
      return acc;
    }, {} as Record<string, { storeName: string, items: CartItem[] }>);
  }, [cart]);

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 animate-in fade-in duration-500">
        <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center text-slate-700">
          <i className="fas fa-shopping-cart text-4xl"></i>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Seu carrinho está vazio</h2>
          <p className="text-slate-500">Parece que você ainda não adicionou nenhum tesouro ao seu cardume.</p>
        </div>
        <Link to="/marketplace" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-lg active:scale-95">
          Explorar Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 mb-10">
        <h2 className="text-3xl font-black text-white">Meu Carrinho</h2>
        <span className="bg-slate-800 text-slate-400 text-xs font-black px-3 py-1 rounded-full border border-white/5 uppercase tracking-widest">
          {cart.length} Itens
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main List */}
        <div className="lg:col-span-8 space-y-10">
          {/* Explicitly cast Object.entries to ensure 'group' is not 'unknown' */}
          {(Object.entries(groupedByStore) as Array<[string, { storeName: string; items: CartItem[] }]>).map(([storeId, group]) => (
            <div key={storeId} className="space-y-4 animate-in fade-in duration-700">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400">
                    <i className="fas fa-shop text-xs"></i>
                  </div>
                  <h3 className="font-black text-slate-300 uppercase tracking-widest text-sm">{group.storeName}</h3>
                </div>
                <Link to={`/loja/${storeId}`} className="text-[10px] font-bold text-slate-500 hover:text-purple-400 uppercase tracking-tighter transition-colors">
                  Ver loja →
                </Link>
              </div>

              <div className="space-y-2">
                {group.items.map(item => (
                  <div key={item.id} className="group bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 flex items-center space-x-6 hover:border-slate-700 transition-all">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-slate-800 bg-slate-950">
                      <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.type}</span>
                      <h4 className="font-bold text-white truncate text-sm mb-1">{item.name}</h4>
                      <p className="text-xs font-black text-emerald-400">R$ {item.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <i className="fas fa-minus text-[10px]"></i>
                        </button>
                        <span className="w-8 text-center text-xs font-black text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <i className="fas fa-plus text-[10px]"></i>
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-600 hover:text-pink-500 transition-colors p-2"
                      >
                        <i className="fas fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 sticky top-8 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <h3 className="text-xl font-black text-white mb-8">Resumo</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-300 font-bold">R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Frete estimado</span>
                <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest">Sob consulta</span>
              </div>
              <div className="h-px bg-slate-800 my-4"></div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-black text-white uppercase tracking-widest">Total Geral</span>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-400">R$ {total.toFixed(2)}</p>
                  <p className="text-[9px] text-slate-600 uppercase font-black">Em até 12x s/ juros</p>
                </div>
              </div>
            </div>

            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] flex items-center justify-center space-x-3 group">
              <span>Finalizar Cardume</span>
              <i className="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
            </button>

            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-3 text-slate-500 group cursor-help">
                <i className="fas fa-shield-halved text-emerald-500/50"></i>
                <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-slate-300">Pagamento 100% Seguro</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-500 group cursor-help">
                <i className="fas fa-rotate-left text-blue-500/50"></i>
                <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-slate-300">Troca fácil entre lojistas</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/20 border border-slate-800 border-dashed rounded-3xl p-6 text-center space-y-3">
             <i className="fas fa-ticket text-purple-500/50"></i>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Possui um cupom?</p>
             <div className="flex space-x-2">
                <input type="text" placeholder="CÓDIGO" className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono uppercase focus:outline-none focus:border-purple-500" />
                <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">Aplicar</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
