
import React, { useEffect, useState, useMemo } from 'react';
import { CartItem, UserAddress, ShippingMethod, PaymentMethod } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { 
  getAddresses, 
  getStoreShippingMethods, 
  getStorePaymentMethods, 
  createOrderFull 
} from '../services/supabaseService';
import { useNotification } from '../components/NotificationProvider';

interface CartPageProps {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: (storeId?: string | number) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ cart, updateQuantity, removeFromCart, clearCart }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  // Checkout Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | number | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | number | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<number | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | string | null>(null);
  
  const [checkoutStep, setCheckoutStep] = useState<'store' | 'shipping' | 'payment'>('store');
  const [isProcessing, setIsProcessing] = useState(false);

  const isLojista = user?.role_id === 6;
  const total = cart.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);

  const cartByStore = useMemo(() => {
    return cart.reduce((groups, item) => {
      const storeId = item.storeId || item.store_id || 'unknown';
      const storeName = item.storeName || 'Marketplace';
      if (!groups[storeId]) {
        groups[storeId] = { id: storeId, name: storeName, items: [], total: 0 };
      }
      groups[storeId].items.push(item);
      groups[storeId].total += (Number(item.price) || 0) * (item.quantity || 1);
      return groups;
    }, {} as Record<string, { id: string | number, name: string, items: CartItem[], total: number }>);
  }, [cart]);

  const storesInCart = Object.values(cartByStore);

  useEffect(() => {
    if (isLojista) {
      navigate('/');
    } else if (user) {
      getAddresses().then(data => {
        setAddresses(data);
        const primary = data.find((a: any) => a.is_primary);
        if (primary && !selectedAddressId) setSelectedAddressId(primary.id);
      });
    }
  }, [isLojista, navigate, user, selectedAddressId]);

  // Fetch store-specific methods when store is selected
  useEffect(() => {
    if (selectedStoreId && selectedStoreId !== 'unknown') {
      getStoreShippingMethods(selectedStoreId).then(setShippingMethods);
      getStorePaymentMethods(selectedStoreId).then(setPaymentMethods);
    }
  }, [selectedStoreId]);

  const handleOpenCheckout = () => {
    if (!user) {
      showNotification("Faça login para finalizar o pedido", "error");
      return;
    }
    if (storesInCart.length === 1) {
      setSelectedStoreId(storesInCart[0].id);
      setCheckoutStep('shipping');
    } else {
      setCheckoutStep('store');
    }
    setIsModalOpen(true);
  };

  const handleProcessCheckout = async () => {
    if (!selectedStoreId || !selectedAddressId || !selectedShippingId || !selectedPaymentId) {
      showNotification("Preencha todos os campos", "info");
      return;
    }

    setIsProcessing(true);
    try {
      const storeItems = cartByStore[selectedStoreId.toString()].items;
      const res = await createOrderFull({
        store_id: Number(selectedStoreId),
        address_id: Number(selectedAddressId),
        shipping_method_id: selectedShippingId,
        payment_method_id: Number(selectedPaymentId),
        items: storeItems.map(i => ({ 
          product_id: Number(i.id), 
          quantity: i.quantity,
          price: Number(i.price) || 0
        }))
      });

      showNotification("Pedido criado! Redirecionando para pagamento...", "success");
      clearCart(selectedStoreId);
      setIsModalOpen(false);
      navigate(`/pedido/${res.id}`);
    } catch (e: any) {
      showNotification(e.message || "Erro ao processar pedido", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLojista) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white">Seu Carrinho</h1>
        <div className="flex items-center space-x-2">
          {storesInCart.length > 1 && (
            <span className="bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-purple-500/20">
              {storesInCart.length} Lojas Diferentes
            </span>
          )}
          <span className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold">
            {cart.length} {cart.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
      </div>

      {cart.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {addresses.length > 0 && selectedAddressId && (
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
                    <i className="fas fa-truck-fast text-purple-400 mr-2"></i>
                    Endereço de Entrega
                  </h2>
                  <Link to="/perfil/editar" className="text-[10px] font-bold text-slate-500 hover:text-purple-400 uppercase tracking-widest">
                    Gerenciar
                  </Link>
                </div>
                {addresses.filter(addr => addr.id === selectedAddressId).map(addr => (
                  <div key={`addr-display-${addr.id}`} className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <i className="fas fa-location-dot"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">
                        {addr.street}, {addr.number}
                        {addr.complement && ` - ${addr.complement}`}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {addr.neighborhood}, {addr.city} - {addr.state}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">CEP: {addr.zip_code}</p>
                    </div>
                    {addresses.length > 1 && (
                      <button 
                        onClick={() => {
                          setCheckoutStep('shipping');
                          setIsModalOpen(true);
                        }}
                        className="text-[10px] font-bold text-purple-400 border border-purple-500/20 bg-purple-500/5 px-2 py-1 rounded-lg hover:bg-purple-500/10 transition-colors uppercase"
                      >
                        Trocar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {storesInCart.map((storeGroup, sIdx) => (
              <div key={`store-group-${storeGroup.id || sIdx}`} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center border border-purple-500/20">
                      <i className="fas fa-shop text-xs text-purple-400"></i>
                    </div>
                    <span className="text-sm font-black text-white uppercase tracking-widest">{storeGroup.name}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">Subtotal: R$ {storeGroup.total.toFixed(2)}</span>
                </div>
                
                <div className="space-y-3">
                  {storeGroup.items.map((item, iIdx) => (
                    <motion.div 
                      layout
                      key={`cart-item-${storeGroup.id}-${item.id || iIdx}`} 
                      className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 group hover:border-purple-500/30 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                        <img 
                          src={item.imageUrl || (item as any).image_url || 'https://via.placeholder.com/150'} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">R$ {(Number(item.price) || 0).toFixed(2)} / un</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 scale-90 md:scale-100">
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
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                        >
                          <i className="fas fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 sticky top-24">
              <h2 className="text-xl font-bold text-white">Resumo Total</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                <i className="fas fa-circle-info mr-1 text-purple-400"></i>
                Pedidos são realizados por loja. Selecione qual loja deseja pagar ao finalizar.
              </p>
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Itens (Total)</span>
                  <span>R$ {(total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-black text-xl pt-4 border-t border-slate-800">
                  <span>Total Global</span>
                  <span className="text-purple-400">R$ {(total || 0).toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={handleOpenCheckout}
                disabled={isProcessing || cart.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-4 rounded-xl shadow-xl shadow-purple-600/20 transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{isProcessing ? 'Processando...' : 'Finalizar Pedido'}</span>
                {!isProcessing && <i className="fas fa-arrow-right text-xs"></i>}
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

      {/* Checkout Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl shadow-purple-500/10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-widest">Finalizar Pedido</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">
                    {checkoutStep === 'store' && 'Passo 1: Selecione a Loja'}
                    {checkoutStep === 'shipping' && 'Passo 2: Entrega'}
                    {checkoutStep === 'payment' && 'Passo 3: Pagamento'}
                  </p>
                </div>
                <button 
                  onClick={() => !isProcessing && setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {checkoutStep === 'store' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400 leading-relaxed text-center">
                      Seu carrinho possui itens de múltiplas lojas. <br/>
                      <span className="text-white font-bold">Selecione qual deseja pagar primeiro:</span>
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {storesInCart.map((store, idx) => (
                        <button
                          key={`modal-store-${store.id || idx}`}
                          onClick={() => {
                            setSelectedStoreId(store.id);
                            setCheckoutStep('shipping');
                          }}
                          className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-purple-500/50 transition-all group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                              <i className="fas fa-store"></i>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black text-white tracking-widest uppercase">{store.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">{store.items.length} itens</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-purple-400">R$ {store.total.toFixed(2)}</p>
                            <i className="fas fa-arrow-right text-[10px] text-slate-600 group-hover:translate-x-1 transition-transform"></i>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {checkoutStep === 'shipping' && (
                  <div className="space-y-6">
                    {/* Address Selection */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Endereço de Entrega</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {addresses.map((addr, idx) => (
                          <button
                            key={`modal-addr-${addr.id || idx}`}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 rounded-2xl border transition-all text-left flex items-start space-x-3 ${
                              selectedAddressId === addr.id 
                                ? 'bg-purple-600/10 border-purple-500 text-white' 
                                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            <div className={`mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              selectedAddressId === addr.id ? 'border-purple-400 bg-purple-400' : 'border-slate-600'
                            }`}>
                              {selectedAddressId === addr.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">{addr.street}, {addr.number}</p>
                              <p className="text-[10px] opacity-60 uppercase tracking-tighter">{addr.neighborhood}, {addr.city} - {addr.state}</p>
                            </div>
                          </button>
                        ))}
                        <Link to="/perfil/editar" className="flex items-center justify-center p-3 border border-slate-800 border-dashed rounded-xl text-[10px] font-bold text-slate-500 hover:text-white transition-colors">
                          <i className="fas fa-plus mr-2"></i> Adicionar Endereço
                        </Link>
                      </div>
                    </div>

                    {/* Shipping Method Selection */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Método de Envio</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {shippingMethods.length > 0 ? (
                          shippingMethods.map((method, idx) => (
                            <button
                              key={`modal-shipping-${method.id || idx}`}
                              onClick={() => setSelectedShippingId(method.id)}
                              className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                                selectedShippingId === method.id 
                                  ? 'bg-purple-600/10 border-purple-500 text-white' 
                                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                  selectedShippingId === method.id ? 'border-purple-400 bg-purple-400' : 'border-slate-600'
                                }`}>
                                  {selectedShippingId === method.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                </div>
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-widest">{method.name}</p>
                                  <p className="text-[10px] opacity-60">Prazo: {method.estimated_days} dias úteis</p>
                                </div>
                              </div>
                              <span className="text-xs font-black">
                                {method.price === 0 ? 'Grátis' : `R$ ${Number(method.price).toFixed(2)}`}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                            <i className="fas fa-truck-ramp-box text-slate-700 text-2xl mb-2"></i>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Calculando fretes...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'payment' && (
                   <div className="space-y-6">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Forma de Pagamento</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {paymentMethods.length > 0 ? (
                            paymentMethods.map((method, idx) => (
                              <button
                                key={`modal-payment-${method.id || idx}`}
                                onClick={() => setSelectedPaymentId(method.id)}
                                className={`p-4 rounded-2xl border transition-all text-left flex items-center space-x-3 group ${
                                  selectedPaymentId === method.id 
                                    ? 'bg-purple-600/10 border-purple-500 text-white' 
                                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                  selectedPaymentId === method.id ? 'border-purple-400 bg-purple-400' : 'border-slate-600'
                                }`}>
                                  {selectedPaymentId === method.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-bold uppercase tracking-widest">{method.name}</p>
                                  <p className="text-[10px] opacity-60">{method.description}</p>
                                </div>
                                <i className={`fas ${method.type === 'pix' ? 'fa-pix' : 'fa-credit-card'} text-slate-600 group-hover:text-purple-400 transition-colors`}></i>
                              </button>
                            ))
                          ) : (
                            <div className="p-8 text-center bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                              <i className="fas fa-credit-card text-slate-700 text-2xl mb-2"></i>
                              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Carregando pagamentos...</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Subtotal</span>
                          <span>R$ {selectedStoreId ? cartByStore[selectedStoreId.toString()].total.toFixed(2) : '0.00'}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Frete</span>
                          <span>R$ {(shippingMethods.find(m => m.id === selectedShippingId)?.price || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-black text-white pt-3 border-t border-slate-800">
                          <span>Total a pagar</span>
                          <span className="text-purple-400">
                            R$ {(
                              (selectedStoreId ? cartByStore[selectedStoreId.toString()].total : 0) + 
                              (shippingMethods.find(m => m.id === selectedShippingId)?.price || 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                   </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-800 flex items-center space-x-3">
                {checkoutStep !== 'store' && storesInCart.length > 1 && (
                  <button
                    disabled={isProcessing}
                    onClick={() => {
                        if (checkoutStep === 'shipping') setCheckoutStep('store');
                        else if (checkoutStep === 'payment') setCheckoutStep('shipping');
                    }}
                    className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white transition-colors disabled:opacity-50"
                  >
                    <i className="fas fa-arrow-left"></i>
                  </button>
                )}
                
                {checkoutStep === 'shipping' && (
                  <button
                    disabled={!selectedAddressId || !selectedShippingId || isProcessing}
                    onClick={() => setCheckoutStep('payment')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black h-12 rounded-xl uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>Continuar</span>
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </button>
                )}

                {checkoutStep === 'payment' && (
                  <button
                    disabled={!selectedPaymentId || isProcessing}
                    onClick={handleProcessCheckout}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-600/20 text-white font-black h-12 rounded-xl uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>{isProcessing ? 'Processando...' : 'Pagar Agora'}</span>
                    {!isProcessing && <i className="fas fa-lock text-[10px]"></i>}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
