
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';

export const OrderDetails: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-4">
        <Link to="/pedidos" className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
          <i className="fas fa-arrow-left"></i>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">Detalhes do Pedido</h1>
          <p className="text-slate-500 text-sm font-medium">#{id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-6 flex items-center">
              <i className="fas fa-shopping-bag mr-2 text-purple-400"></i>
              Mesa de Itens
            </h3>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center space-x-4 py-4 border-t border-slate-800/50">
                  <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden shrink-0">
                    <img src="https://via.placeholder.com/150" alt="Product" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm">Produto Exemplo #{i}</h4>
                    <p className="text-xs text-slate-500">Qtd: 1</p>
                  </div>
                  <span className="font-black text-white text-sm">R$ 50,00</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-white flex items-center">
              <i className="fas fa-truck mr-2 text-purple-400"></i>
              Entrega
            </h3>
            <div className="space-y-1">
              <p className="text-sm text-white font-bold">Endereço Principal</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Rua das Cartas, 777<br />
                Vila do Cardume, SC<br />
                88000-000
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/50">
              <p className="text-xs text-slate-500 uppercase font-black mb-2">Status do Envio</p>
              <div className="flex items-center text-emerald-400 text-xs font-bold">
                <i className="fas fa-circle-check mr-2"></i>
                Em trânsito
              </div>
            </div>
          </div>

          <div className="bg-purple-600/10 border border-purple-500/20 rounded-2xl p-6">
             <h3 className="font-bold text-white text-sm mb-4">Resumo Financeiro</h3>
             <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span>R$ 100,00</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Frete</span>
                  <span className="text-emerald-400">Grátis</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 mt-2 border-t border-white/5">
                  <span>Total</span>
                  <span className="text-purple-400">R$ 100,00</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
