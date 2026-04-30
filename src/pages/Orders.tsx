
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { getUserOrders, getReceivedOrders, updateOrderStatus, cleanupExpiredOrders } from '../services/supabaseService';

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const isLojista = user?.role_id === 6;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Run cleanup
      await cleanupExpiredOrders();
      
      const data = isLojista ? await getReceivedOrders() : await getUserOrders();
      setOrders(data);
      setLoading(false);
    };
    fetchData();
  }, [isLojista]);

  const filteredOrders = orders.filter(o => 
    filter === 'all' || o.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-400/10 text-emerald-400';
      case 'pending': return 'bg-orange-400/10 text-orange-400';
      case 'expired': return 'bg-red-400/10 text-red-400';
      case 'shipped': return 'bg-blue-400/10 text-blue-400';
      case 'delivered': return 'bg-green-400/10 text-green-400';
      default: return 'bg-purple-600/10 text-purple-400';
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const updated = await updateOrderStatus(orderId, newStatus);
    if (updated) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  if (!user) return <div className="p-20 text-center text-slate-500 font-bold">Faça login para ver seus pedidos.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">{isLojista ? 'Gestão de Pedidos' : 'Meus Pedidos'}</h1>
          <p className="text-slate-500 text-sm">{isLojista ? 'Gerencie as vendas da sua loja' : 'Histórico de compras e ingressos'}</p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          {['all', 'pending', 'paid', 'shipped', 'delivered', 'expired'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === s ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-500 hover:text-white'
              }`}
            >
              {s === 'all' ? 'Todos' : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-bold">Carregando pedidos...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="relative group">
              <motion.div 
                whileHover={{ x: 4 }}
                className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-6 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-purple-400 group-hover:bg-purple-400/10 transition-colors">
                    {isLojista ? (
                        <img src={order.buyer?.avatar || `https://i.pravatar.cc/150?u=${order.buyer?.id}`} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    ) : (
                        <i className="fas fa-box text-xl"></i>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                        <Link to={`/pedido/${order.id}`} className="font-bold text-white hover:text-purple-400 transition-colors">
                          #{order.id}
                        </Link>
                        {isLojista && (
                            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full font-bold">
                                {order.buyer?.codename || order.buyer?.username}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')} • {order.store?.name || 'Loja'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 md:space-x-8">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-black mb-1">Total</p>
                    <p className="text-lg font-black text-white">R$ {(order.amount || 0).toFixed(2)}</p>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <p className="text-xs text-slate-500 uppercase font-black mb-1">Status</p>
                    {isLojista ? (
                        <select 
                            value={order.status} 
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest bg-slate-800 border-none focus:ring-1 focus:ring-purple-500 cursor-pointer ${getStatusColor(order.status)}`}
                        >
                            <option value="pending">Pendente</option>
                            <option value="paid">Pago</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregue</option>
                            <option value="expired">Expirado</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    ) : (
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${getStatusColor(order.status)}`}>
                            {order.status === 'paid' ? 'Pago' : 
                             order.status === 'pending' ? 'Pendente' : 
                             order.status === 'expired' ? 'Expirado' : 
                             order.status === 'shipped' ? 'Enviado' :
                             order.status === 'delivered' ? 'Entregue' : order.status}
                        </span>
                    )}
                  </div>

                  <Link to={`/pedido/${order.id}`} className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-500 hover:text-purple-400 transition-colors">
                    <i className="fas fa-chevron-right"></i>
                  </Link>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {orders.length === 0 && !loading && (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-24 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700">
            <i className="fas fa-clipboard-list text-3xl"></i>
          </div>
          <p className="text-slate-500 font-bold">Nenhum pedido encontrado.</p>
          {!isLojista && (
            <Link to="/produtos" className="inline-block bg-purple-600 hover:bg-purple-500 text-white text-xs font-black px-6 py-3 rounded-xl transition-all uppercase tracking-widest">
                Ir para o shopping
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

