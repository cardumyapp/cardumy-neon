
import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const Orders: React.FC = () => {
  // Mock data as I don't have the original
  const orders = [
    { id: 'ORD-1234', date: '25 Abr 2026', total: 150.00, status: 'Em processamento', items: 3 },
    { id: 'ORD-1233', date: '20 Abr 2026', total: 89.90, status: 'Entregue', items: 1 }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white">Meus Pedidos</h1>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Link key={order.id} to={`/pedido/${order.id}`}>
            <motion.div 
              whileHover={{ x: 4 }}
              className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-6 hover:border-purple-500/30 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-purple-400 group-hover:bg-purple-400/10 transition-colors">
                  <i className="fas fa-box text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">{order.id}</h3>
                  <p className="text-xs text-slate-500">{order.date} • {order.items} {order.items === 1 ? 'item' : 'itens'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-black mb-1">Valor Total</p>
                  <p className="text-lg font-black text-white">R$ {(order.total || 0).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-black mb-1">Status</p>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    order.status === 'Entregue' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-purple-600/10 text-purple-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <i className="fas fa-chevron-right text-slate-700 group-hover:text-purple-400 transition-colors"></i>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-24 text-center space-y-4">
          <p className="text-slate-500">Você ainda não realizou nenhum pedido.</p>
          <Link to="/produtos" className="text-purple-400 font-bold hover:underline">Ir para o shopping →</Link>
        </div>
      )}
    </div>
  );
};
