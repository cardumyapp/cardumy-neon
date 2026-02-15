
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_ORDERS, MOCK_TICKETS } from '../constants';

export const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'tickets'>('orders');

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Atividades</h2>
          <p className="text-slate-400">Rastreie suas compras por loja e gerencie seus ingressos.</p>
        </div>
        
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'orders' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'tickets' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Ingressos
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-10">
          {MOCK_ORDERS.map(order => (
            <div key={order.id} className="group bg-slate-900/40 border border-slate-800 rounded-[32px] overflow-hidden hover:border-purple-500/30 transition-all duration-500 shadow-2xl relative">
              {/* Pedido Separado por Loja Banner */}
              <div className="bg-slate-950/80 px-8 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                    <i className="fas fa-shop text-sm"></i>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                       <span className="text-xs font-black text-white uppercase tracking-widest">{order.storeName}</span>
                       <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                       <span className="text-[10px] font-bold text-slate-500">ID: {order.id}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Venda independente e direta via Cardumy</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                   <Link 
                     to={`/pedido/${order.id}`}
                     className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95 flex items-center space-x-2"
                   >
                     <i className="fas fa-file-invoice text-slate-400"></i>
                     <span>Ver Detalhes</span>
                   </Link>
                   <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center space-x-2">
                     <i className="fas fa-truck-fast"></i>
                     <span>Rastrear</span>
                   </button>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Itens do Pedido */}
                  <div className="lg:col-span-8 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Itens da Loja</h4>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50">
                        <div className="flex items-center space-x-4">
                           <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-slate-700">
                             <i className="fas fa-box"></i>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-white leading-none mb-1">{item.name}</span>
                             <span className="text-[10px] text-slate-500 font-black uppercase">Qtd: {item.quantity}</span>
                           </div>
                        </div>
                        <span className="text-sm font-black text-slate-300">R$ {item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Resumo e Frete Destacado */}
                  <div className="lg:col-span-4 bg-slate-950/50 p-6 rounded-[24px] border border-slate-800 space-y-6">
                    <div className="space-y-3">
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold uppercase tracking-widest">Subtotal</span>
                          <span className="text-slate-300 font-bold">R$ {(order.total - order.shippingCost).toFixed(2)}</span>
                       </div>
                       
                       {/* Destaque do Frete */}
                       <div className="flex justify-between items-center p-3 bg-purple-600/10 rounded-xl border border-purple-500/20 shadow-sm">
                          <div className="flex items-center space-x-2 text-purple-400">
                             <i className="fas fa-truck-ramp-box text-xs"></i>
                             <span className="text-[10px] font-black uppercase tracking-widest">Valor do Frete</span>
                          </div>
                          <span className="text-sm font-black text-white">R$ {order.shippingCost.toFixed(2)}</span>
                       </div>

                       <div className="h-px bg-slate-800 my-4"></div>

                       <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-white uppercase tracking-widest">Total do Pedido</span>
                          <span className="text-2xl font-black text-emerald-400">R$ {order.total.toFixed(2)}</span>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full animate-pulse ${order.status === 'Pendente' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{order.status}</span>
                       </div>
                       <span className="text-[9px] text-slate-600 font-medium italic">{order.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {MOCK_ORDERS.length === 0 && (
            <div className="py-24 text-center space-y-4 bg-slate-900/20 rounded-[40px] border border-dashed border-slate-800">
               <i className="fas fa-box-open text-4xl text-slate-700"></i>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum pedido realizado.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {MOCK_TICKETS.map(ticket => (
            <div key={ticket.id} className="bg-slate-900 rounded-[32px] border border-slate-800 overflow-hidden flex flex-col md:flex-row shadow-2xl group hover:border-purple-500/50 transition-all">
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

          {MOCK_TICKETS.length === 0 && (
            <div className="col-span-full py-24 text-center space-y-4 bg-slate-900/20 rounded-[40px] border border-dashed border-slate-800">
               <i className="fas fa-ticket-simple text-4xl text-slate-700"></i>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum ingresso encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
