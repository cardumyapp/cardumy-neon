
import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_ORDERS } from '../constants';

export const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const order = MOCK_ORDERS.find(o => o.id === id);
  const [commentText, setCommentText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <i className="fas fa-file-circle-exclamation text-6xl text-slate-800"></i>
        <h2 className="text-2xl font-bold text-slate-500">Pedido não encontrado</h2>
        <Link to="/pedidos" className="text-purple-400 hover:underline">Voltar para meus pedidos</Link>
      </div>
    );
  }

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    // Mock functionality
    setCommentText('');
  };

  const isManualPayment = order.paymentMethod === 'Pix Direto' || order.paymentMethod === 'A combinar com vendedor';
  
  // Lógica de Rastreio
  const hasBeenShipped = order.status === 'Enviado' || order.status === 'Entregue';
  const trackingInfo = hasBeenShipped ? 'BR987654321TCG' : 'Aguardando envio';

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <Link to="/pedidos" className="text-slate-500 hover:text-white flex items-center space-x-2 font-bold transition-colors">
          <i className="fas fa-arrow-left"></i>
          <span>Voltar para Pedidos</span>
        </Link>
        <div className="flex items-center space-x-3">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status:</span>
           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
             order.status === 'Enviado' ? 'bg-blue-600/20 text-blue-400' : 
             order.status === 'Pendente' ? 'bg-amber-600/20 text-amber-400' : 'bg-emerald-600/20 text-emerald-400'
           }`}>
             {order.status}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          {/* Header Info */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-8 space-y-6 shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                <i className="fas fa-receipt"></i>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">{order.id}</h2>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{order.storeName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Data da Compra</p>
                <p className="text-sm font-bold text-white">{order.date}</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Pagamento</p>
                <p className="text-sm font-bold text-white truncate">{order.paymentMethod}</p>
              </div>
              
              {/* Campo de Rastreio */}
              <div className={`p-4 rounded-2xl border transition-all ${
                hasBeenShipped 
                ? 'bg-blue-600/10 border-blue-500/30' 
                : 'bg-slate-950 border-slate-800'
              }`}>
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Rastreio</p>
                <div className="flex items-center space-x-2">
                  <i className={`fas ${hasBeenShipped ? 'fa-truck-fast text-blue-400' : 'fa-clock text-slate-600'} text-xs`}></i>
                  <p className={`text-sm font-bold ${hasBeenShipped ? 'text-blue-400' : 'text-slate-500'}`}>
                    {trackingInfo}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Items Table */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-[32px] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Itens do Pedido</h3>
            </div>
            <div className="p-6 space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-950/30 rounded-2xl border border-slate-800/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-slate-700 font-bold">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase">Preço Unitário: R$ {item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-300">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Chat Section */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-[32px] flex flex-col h-[500px] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
               <h3 className="text-sm font-black text-white uppercase tracking-widest">Conversa com Lojista</h3>
               <span className="text-[10px] text-emerald-400 font-black flex items-center space-x-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                 <span>LOJA ONLINE</span>
               </span>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {order.comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <i className="fas fa-comments text-4xl"></i>
                  <p className="text-xs font-bold uppercase tracking-widest">Sem mensagens ainda</p>
                </div>
              ) : (
                order.comments.map((comment, idx) => (
                  <div key={idx} className={`flex ${comment.isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] space-y-1 ${comment.isAdmin ? 'items-start' : 'items-end'}`}>
                      <p className="text-[9px] font-black uppercase text-slate-600 px-2">
                        {comment.user} • {comment.timestamp}
                      </p>
                      <div className={`p-4 rounded-2xl text-sm ${
                        comment.isAdmin 
                          ? 'bg-slate-800 text-slate-300 border border-slate-700 rounded-tl-none' 
                          : 'bg-purple-600 text-white shadow-lg shadow-purple-600/10 rounded-tr-none'
                      }`}>
                        {comment.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex items-center space-x-4">
              <input 
                type="text" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                placeholder="Digite sua mensagem para a loja..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all"
              />
              <button 
                onClick={handleSendComment}
                className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center justify-center transition-all shadow-lg"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
          {/* Summary */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <h3 className="text-xl font-black text-white">Resumo Financeiro</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-widest">Subtotal Itens</span>
                <span className="text-slate-300 font-bold">R$ {(order.total - order.shippingCost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-widest">Frete (Entrega)</span>
                <span className="text-slate-300 font-bold">R$ {order.shippingCost.toFixed(2)}</span>
              </div>
              
              {order.couponUsed && (
                <div className="flex justify-between items-center text-xs p-2 bg-emerald-600/10 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <i className="fas fa-tag"></i>
                    <span className="font-black uppercase tracking-widest">Cupom Aplicado</span>
                  </div>
                  <span className="text-emerald-400 font-bold">{order.couponUsed}</span>
                </div>
              )}

              <div className="h-px bg-slate-800 my-4"></div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-white uppercase tracking-widest">Total Geral</span>
                <span className="text-3xl font-black text-emerald-400">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>

            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/5">
              Baixar Nota Fiscal
            </button>
          </div>

          {/* Payment Proof Upload (Manual Methods) */}
          {isManualPayment && (
            <div className="bg-purple-600/5 border border-purple-500/20 rounded-[32px] p-8 space-y-6 animate-in slide-in-from-right-4">
              <div className="flex items-center space-x-3 text-purple-400">
                <i className="fas fa-upload"></i>
                <h3 className="text-sm font-black uppercase tracking-widest">Enviar Comprovante</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Este pedido foi feito via <span className="text-white font-bold">{order.paymentMethod}</span>. Por favor, anexe o comprovante de pagamento para que o lojista possa validar sua compra.
              </p>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 group-hover:text-purple-400 transition-colors">
                  <i className="fas fa-cloud-arrow-up text-xl"></i>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                     {selectedFile ? selectedFile.name : 'Selecionar Arquivo'}
                   </p>
                   <p className="text-[9px] text-slate-600">PDF, JPG ou PNG (Máx 5MB)</p>
                </div>
              </div>

              {selectedFile && (
                <button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                  onClick={() => {
                    alert('Comprovante enviado com sucesso!');
                    setSelectedFile(null);
                  }}
                >
                  Confirmar Envio
                </button>
              )}
            </div>
          )}

          {/* Help */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
            <i className="fas fa-circle-question text-slate-700 text-2xl"></i>
            <p className="text-xs text-slate-500">Problemas com este pedido?</p>
            <button className="text-pink-500 font-black uppercase text-[10px] tracking-widest hover:underline">Abrir Disputa / Ajuda</button>
          </div>
        </div>
      </div>
    </div>
  );
};
