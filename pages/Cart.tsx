
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartItem } from '../types';

interface CartPageProps {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
}

type PaymentMethod = 'Mercado Pago' | 'Pix Direto' | 'A combinar com vendedor';

export const CartPage: React.FC<CartPageProps> = ({ cart, updateQuantity, removeFromCart }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentSelections, setPaymentSelections] = useState<Record<string, PaymentMethod>>({});
  const [checkoutStep, setCheckoutStep] = useState<'selection' | 'success'>('selection');

  const groupedByStore = useMemo<Record<string, { storeName: string, items: CartItem[] }>>(() => {
    const groups: Record<string, { storeName: string, items: CartItem[] }> = {};
    cart.forEach(item => {
      if (!groups[item.storeId]) {
        groups[item.storeId] = { storeName: item.storeName, items: [] };
      }
      groups[item.storeId].items.push(item);
    });
    return groups;
  }, [cart]);

  const storeIds = useMemo(() => Object.keys(groupedByStore), [groupedByStore]);
  const total = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const allPaymentsSelected = useMemo(() => storeIds.every(id => paymentSelections[id]), [storeIds, paymentSelections]);

  const handleSelectPayment = (storeId: string, method: PaymentMethod) => {
    setPaymentSelections(prev => ({ ...prev, [storeId]: method }));
  };

  const handleFinish = () => setCheckoutStep('success');
  const closeModal = () => {
    setIsModalOpen(false);
    setCheckoutStep('selection');
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 px-4 text-center">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-900 flex items-center justify-center text-slate-700">
          <i className="fas fa-shopping-cart text-3xl md:text-4xl"></i>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-white">Seu carrinho está vazio</h2>
          <p className="text-slate-500 text-sm md:text-base">Parece que você ainda não adicionou nenhum tesouro.</p>
        </div>
        <Link to="/produtos" className="bg-purple-600 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-lg active:scale-95 text-sm md:text-base">
          Explorar Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 px-2">
        <h2 className="text-2xl md:text-3xl font-black text-white">Meu Carrinho</h2>
        <span className="bg-slate-800 text-slate-400 text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
          {cart.length} Itens
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Main List */}
        <div className="lg:col-span-8 space-y-8 md:space-y-10 px-2">
          {Object.keys(groupedByStore).map((storeId) => {
            const group = groupedByStore[storeId];
            return (
              <div key={storeId} className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400">
                      <i className="fas fa-shop text-[10px] md:text-xs"></i>
                    </div>
                    <h3 className="font-black text-slate-300 uppercase tracking-widest text-[10px] md:text-sm truncate max-w-[150px] md:max-w-none">{group.storeName}</h3>
                  </div>
                  <Link to={`/loja/${storeId}`} className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Loja →</Link>
                </div>

                <div className="space-y-3">
                  {group.items.map(item => (
                    <div key={item.id} className="bg-slate-900/40 border border-slate-800/50 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center space-x-3 md:space-x-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 border border-slate-800 bg-slate-950">
                        <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{item.type}</p>
                        <h4 className="font-bold text-white truncate text-[11px] md:text-sm mb-1">{item.name}</h4>
                        <p className="text-[10px] md:text-xs font-black text-emerald-400">R$ {item.price.toFixed(2)}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-slate-500"><i className="fas fa-minus text-[8px] md:text-[10px]"></i></button>
                          <span className="w-6 md:w-8 text-center text-[10px] md:text-xs font-black text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-slate-500"><i className="fas fa-plus text-[8px] md:text-[10px]"></i></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-pink-500 p-2"><i className="fas fa-trash-can text-xs md:text-sm"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Sidebar - Floating or Final Section */}
        <div className="lg:col-span-4 px-2">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl p-6 md:p-8 space-y-6 md:space-y-8 shadow-2xl">
            <h3 className="text-lg md:text-xl font-black text-white">Resumo</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-slate-500 uppercase tracking-widest font-black text-[9px] md:text-[10px]">Subtotal</span>
                <span className="text-slate-300 font-bold">R$ {total.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-800"></div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] md:text-sm font-black text-white uppercase tracking-widest">Total</span>
                <div className="text-right">
                  <p className="text-xl md:text-3xl font-black text-emerald-400 leading-none">R$ {total.toFixed(2)}</p>
                  <p className="text-[8px] md:text-[9px] text-slate-600 uppercase font-black mt-1">Sincronizado com lojas</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center space-x-3 text-sm md:text-base"
            >
              <span>Finalizar Compra</span>
              <i className="fas fa-arrow-right text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal - Responsive Drawer on Mobile */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center md:items-center justify-center">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={closeModal}></div>
          <div className="relative bg-slate-900 border-t md:border border-slate-800 w-full max-w-2xl md:rounded-[40px] rounded-t-[32px] shadow-2xl flex flex-col h-[85vh] md:h-auto md:max-h-[90vh] bottom-0 md:bottom-auto fixed md:relative animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
            {checkoutStep === 'selection' ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase">Checkout</h3>
                    <button onClick={closeModal} className="text-slate-500 hover:text-white p-2"><i className="fas fa-times text-lg"></i></button>
                  </div>
                  <p className="text-slate-500 text-[10px] md:text-sm uppercase tracking-widest font-black">Selecione os pagamentos por loja</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide">
                  {Object.keys(groupedByStore).map((storeId) => (
                    <div key={storeId} className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-purple-400"><i className="fas fa-shop text-[8px]"></i></div>
                        <span className="font-black text-white uppercase text-[10px] tracking-widest">{groupedByStore[storeId].storeName}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                        {(['Mercado Pago', 'Pix Direto', 'A combinar com vendedor'] as PaymentMethod[]).map(method => (
                          <button
                            key={method}
                            onClick={() => handleSelectPayment(storeId, method)}
                            className={`p-3 md:p-4 rounded-xl border text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center sm:flex-col justify-start sm:justify-center gap-3 ${
                              paymentSelections[storeId] === method 
                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' 
                                : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}
                          >
                            <i className={`fas ${method === 'Mercado Pago' ? 'fa-handshake' : method === 'Pix Direto' ? 'fa-qrcode' : 'fa-comments'} text-sm md:text-lg`}></i>
                            <span>{method}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 md:p-8 border-t border-slate-800 bg-slate-900/50 pb-8 md:pb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-left">
                      <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase">Total</p>
                      <p className="text-lg md:text-2xl font-black text-emerald-400 leading-none">R$ {total.toFixed(2)}</p>
                    </div>
                  </div>
                  <button
                    disabled={!allPaymentsSelected}
                    onClick={handleFinish}
                    className={`w-full py-4 rounded-xl md:rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                      allPaymentsSelected ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Confirmar Pedidos
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 md:p-12 text-center space-y-6 flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-600/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <i className="fas fa-check-double"></i>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Sucesso!</h3>
                  <p className="text-slate-500 text-xs md:text-sm max-w-xs leading-relaxed uppercase tracking-widest font-black">
                    O cardume foi dividido e cada loja recebeu seu pedido.
                  </p>
                </div>
                <button onClick={closeModal} className="w-full max-w-xs bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs">Voltar para o Cardumy</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
