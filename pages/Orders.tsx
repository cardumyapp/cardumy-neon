
import React, { useState } from 'react';
import { MOCK_ORDERS, MOCK_TICKETS } from '../constants';

export const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'tickets'>('orders');

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">Minhas Atividades</h2>
          <p className="text-slate-400">Gerencie seus pedidos de marketplace e ingressos para eventos.</p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'orders' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'tickets' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Ingressos
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-6">
          {MOCK_ORDERS.map(order => (
            <div key={order.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-colors">
              <div className="p-6 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
                    <i className="fas fa-box text-purple-400"></i>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{order.id}</p>
                    <p className="text-sm font-bold text-white">Realizado em {order.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                   <div className="text-right">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                     <p className={`text-sm font-black ${order.status === 'Enviado' ? 'text-blue-400' : 'text-emerald-400'}`}>{order.status}</p>
                   </div>
                   <button className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all">Rastrear</button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-3">
                       <span className="text-slate-500 font-mono">{item.quantity}x</span>
                       <span className="text-slate-200 font-medium">{item.name}</span>
                    </div>
                    <span className="text-slate-400">R$ {item.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-center">
                   <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Total do Pedido</span>
                   <span className="text-xl font-black text-emerald-400">R$ {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {MOCK_TICKETS.map(ticket => (
            <div key={ticket.id} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col md:flex-row shadow-2xl group hover:border-purple-500/50 transition-all">
              <div className="p-8 flex-1 space-y-6">
                <div className="space-y-1">
                  <div className="bg-purple-600/20 text-purple-400 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest inline-block mb-2">Check-in Disponível</div>
                  <h3 className="text-2xl font-black text-white leading-tight">{ticket.eventName}</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-slate-400">
                    <i className="fas fa-calendar-day w-5 text-center text-purple-500"></i>
                    <span className="text-sm font-medium">{ticket.date}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-400">
                    <i className="fas fa-location-dot w-5 text-center text-purple-500"></i>
                    <span className="text-sm font-medium truncate">{ticket.location}</span>
                  </div>
                </div>

                <div className="pt-4">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">ID do Ingresso</p>
                   <p className="text-xs font-mono text-slate-400">{ticket.id}</p>
                </div>
              </div>

              <div className="bg-white p-8 md:w-48 flex flex-col items-center justify-center space-y-4 border-t md:border-t-0 md:border-l border-slate-800">
                 <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.qrCode}`} 
                  className="w-32 h-32 grayscale group-hover:grayscale-0 transition-all duration-500" 
                  alt="QR Code" 
                 />
                 <span className="text-[10px] font-black text-slate-950 uppercase tracking-tighter">Apresentar na entrada</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
