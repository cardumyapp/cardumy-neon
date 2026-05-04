
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { getOrderDetails, updateOrderStatus } from '../services/supabaseService';
import { useAuth } from '../components/AuthProvider';

export const OrderDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isLojista = user?.role_id === 6;

  useEffect(() => {
    const fetchOrder = async () => {
      if (id) {
        const data = await getOrderDetails(id);
        setOrder(data);
      }
      setLoading(false);
    };
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    const updated = await updateOrderStatus(id, newStatus);
    if (updated) {
      setOrder({ ...order, status: newStatus });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-emerald-400';
      case 'pending': return 'text-orange-400';
      case 'expired': return 'text-red-400';
      case 'shipped': return 'text-blue-400';
      case 'delivered': return 'text-green-400';
      default: return 'text-purple-400';
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-500">Carregando detalhes do pedido...</div>;
  if (!order) return <div className="py-20 text-center text-slate-500">Pedido não encontrado.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center space-x-4">
        <Link to="/pedidos" className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
          <i className="fas fa-arrow-left"></i>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">Detalhes do Pedido</h1>
          <p className="text-slate-500 text-sm font-medium">#{id?.toUpperCase()}</p>
        </div>

        {isLojista && (
            <div className="ml-auto flex items-center space-x-3">
                <span className="text-[10px] font-black uppercase text-slate-500">Alterar Status:</span>
                <select 
                    value={order.status || ''} 
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs font-bold text-white rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-purple-500 outline-none"
                >
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="canceled">Cancelado</option>
                    <option value="expired">Expirado</option>
                </select>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-6 flex items-center">
              <i className="fas fa-shopping-bag mr-2 text-purple-400"></i>
              Resumo dos Itens
            </h3>
            <div className="space-y-4">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex items-center space-x-4 py-4 border-t border-slate-800/50 first:border-t-0 first:pt-0">
                  <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden shrink-0">
                    <img src={item.product?.image_url || "https://via.placeholder.com/150"} alt={item.product?.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm">{item.product?.name || 'Produto'}</h4>
                    <p className="text-xs text-slate-500">Lote #{String(item.product_id).slice(0, 6)} • Qtd: {item.quantity}</p>
                  </div>
                  <span className="font-black text-white text-sm">R$ {(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
             <h3 className="font-bold text-white mb-4">Informações do Comprador</h3>
             <div className="flex items-center space-x-4">
                <img src={order.buyer?.avatar || `https://i.pravatar.cc/150?u=${order.buyer?.id}`} className="w-12 h-12 rounded-full border border-slate-800" alt="" />
                <div>
                    <p className="text-sm font-bold text-white">{order.buyer?.codename || order.buyer?.username}</p>
                    <p className="text-xs text-slate-500">{order.buyer?.email}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-white flex items-center">
              <i className="fas fa-info-circle mr-2 text-purple-400"></i>
              Status do Pedido
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-black mb-2">Estado Atual</p>
                <div className={`flex items-center text-xs font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                  <i className="fas fa-circle mr-2 text-[8px] animate-pulse"></i>
                  {order.status === 'paid' ? 'Pago' : 
                   order.status === 'pending' ? 'Pendente' : 
                   order.status === 'expired' ? 'Expirado' : 
                   order.status === 'canceled' ? 'Cancelado' : order.status}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase font-black mb-2">Data do Pedido</p>
                <p className="text-sm text-white font-bold">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/50">
                <p className="text-xs text-slate-500 uppercase font-black mb-2">Loja Responsável</p>
                <div className="flex items-center text-white text-xs font-bold">
                  <i className="fas fa-shop mr-2 text-slate-500"></i>
                  {order.store?.name}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-600/10 border border-purple-500/20 rounded-2xl p-6">
             <h3 className="font-bold text-white text-sm mb-4">Resumo Financeiro</h3>
             <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span>R$ {(order.amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Frete</span>
                  <span className="text-emerald-400">Grátis</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 mt-2 border-t border-white/5">
                  <span>Total</span>
                  <span className="text-purple-400">R$ {(order.amount || 0).toFixed(2)}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

