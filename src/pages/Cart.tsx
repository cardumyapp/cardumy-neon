
import React from 'react';
import { CartItem } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface CartPageProps {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ cart, updateQuantity, removeFromCart }) => {
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white">Seu Carrinho</h1>
        <span className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold">
          {cart.length} {cart.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {cart.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <motion.div 
                layout
                key={item.id} 
                className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 group hover:border-purple-500/30 transition-colors"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                  <img 
                    src={item.imageUrl || (item as any).image_url || 'https://via.placeholder.com/150'} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{item.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">R$ {item.price.toFixed(2)} / un</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-l-lg transition-colors"
                    >
                      <i className="fas fa-minus text-[10px]"></i>
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-r-lg transition-colors"
                    >
                      <i className="fas fa-plus text-[10px]"></i>
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  >
                    <i className="fas fa-trash-can text-sm"></i>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 sticky top-24">
              <h2 className="text-xl font-bold text-white">Resumo</h2>
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Frete</span>
                  <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-full">Grátis</span>
                </div>
                <div className="flex justify-between text-white font-black text-xl pt-4 border-t border-slate-800">
                  <span>Total</span>
                  <span className="text-purple-400">R$ {total.toFixed(2)}</span>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-4 rounded-xl shadow-xl shadow-purple-600/20 transition-all active:scale-95 flex items-center justify-center space-x-2">
                <span>Finalizar Pedido</span>
                <i className="fas fa-arrow-right text-xs"></i>
              </button>
              <Link to="/produtos" className="block text-center text-xs font-bold text-slate-500 hover:text-white transition-colors">
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-24 text-center space-y-6">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600 text-3xl">
            <i className="fas fa-shopping-cart"></i>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Seu carrinho está vazio</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">Explore o marketplace e encontre as melhores cartas e produtos para sua coleção.</p>
          </div>
          <Link 
            to="/produtos" 
            className="inline-flex bg-purple-600 hover:bg-purple-500 text-white font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95"
          >
            Ver Produtos
          </Link>
        </div>
      )}
    </div>
  );
};
