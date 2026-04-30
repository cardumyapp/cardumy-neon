
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useNotification } from '../components/NotificationProvider';
import { updateStoreStock } from '../services/supabaseService';

interface StockItem {
  id: number;
  product_id: number;
  quantity: number;
  store_price: number | null;
  pre_sale: boolean;
  products: {
    id: number;
    name: string;
    slug: string;
    image_url: string | null;
    cardgames: { name: string };
  };
}

export const ManageStock: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStoreAndStock = async () => {
      if (!user?.username) return;
      
      try {
        setLoading(true);
        // 1. Get Store Info
        const storeRes = await fetch(`/api/lojas/${user.username}`);
        const storeData = await storeRes.json();
        
        if (storeData.error) throw new Error(storeData.error);
        if (!storeData.store) throw new Error("Loja não encontrada para este usuário.");
        
        setStore(storeData.store);

        // 2. Get Stock
        const stockRes = await fetch(`/api/lojas/${user.username}/estoque`);
        const stockData = await stockRes.json();
        
        if (Array.isArray(stockData)) {
          setStock(stockData);
        } else {
          setStock([]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreAndStock();
  }, [user]);

  const handleUpdate = async (productId: number, quantity: number, price: number, preSale: boolean) => {
    if (!store?.id) return;

    try {
      const result = await updateStoreStock(store.id, productId, quantity, price, preSale);
      
      if (!result || result.error) throw new Error(result?.error || "Falha ao atualizar estoque");

      showNotification("Estoque atualizado com sucesso!", "success");

      // Update local state
      setStock(prev => prev.map(item => 
        item.product_id === productId 
          ? { ...item, quantity, store_price: price, pre_sale: preSale } 
          : item
      ));
    } catch (err: any) {
      showNotification(err.message, "error");
    }
  };

  const filteredStock = stock.filter(item => 
    item.products.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl text-center">
      <i className="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
      <p className="text-red-400 font-bold">{error}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter">GERENCIAR ESTOQUE</h1>
          <p className="text-slate-400 font-medium">Controle os produtos disponíveis em sua loja</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-slate-800/50 px-4 py-2 rounded-full border border-white/5 w-full md:w-96">
          <i className="fas fa-search text-slate-500"></i>
          <input 
            type="text" 
            placeholder="Filtrar em seu estoque..." 
            className="bg-transparent border-none focus:outline-none w-full text-sm placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredStock.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500 text-2xl">
              <i className="fas fa-box-open"></i>
            </div>
            <h3 className="text-white font-bold mb-2">Nenhum produto encontrado</h3>
            <p className="text-slate-500 text-sm">Você ainda não tem produtos em seu estoque ou o filtro não retornou resultados.</p>
          </div>
        ) : (
          filteredStock.map((item) => (
            <div key={item.id} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-4 md:p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 group hover:border-purple-500/50 transition-all duration-500">
              <div className="relative shrink-0">
                <img 
                  src={item.products.image_url || 'https://via.placeholder.com/150'} 
                  alt={item.products.name}
                  className="w-24 h-32 object-cover rounded-xl border border-white/5 shadow-2xl group-hover:scale-105 transition-transform duration-500"
                />
                {!item.quantity && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 rotate-12">Sem Estoque</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    {item.products.cardgames.name}
                  </span>
                  {item.pre_sale && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                       Pré-Venda
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1 truncate">{item.products.name}</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {item.product_id}</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 items-center gap-4 w-full lg:w-auto">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Quantidade</label>
                  <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                    <button 
                      onClick={() => handleUpdate(item.product_id, Math.max(0, item.quantity - 1), item.store_price || 0, item.pre_sale)}
                      className="text-slate-500 hover:text-white transition-colors"
                    >
                      <i className="fas fa-minus text-xs"></i>
                    </button>
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdate(item.product_id, parseInt(e.target.value) || 0, item.store_price || 0, item.pre_sale)}
                      className="bg-transparent w-12 text-center text-sm font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      onClick={() => handleUpdate(item.product_id, item.quantity + 1, item.store_price || 0, item.pre_sale)}
                      className="text-slate-500 hover:text-white transition-colors"
                    >
                      <i className="fas fa-plus text-xs"></i>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Preço (R$)</label>
                  <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex items-center">
                    <span className="text-slate-600 text-xs mr-1">R$</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={item.store_price || 0}
                      onChange={(e) => handleUpdate(item.product_id, item.quantity, parseFloat(e.target.value) || 0, item.pre_sale)}
                      className="bg-transparent w-full text-sm font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center space-y-1">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Pré-Venda</label>
                   <button 
                     onClick={() => handleUpdate(item.product_id, item.quantity, item.store_price || 0, !item.pre_sale)}
                     className={`w-10 h-6 rounded-full transition-all relative ${item.pre_sale ? 'bg-amber-600' : 'bg-slate-800'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.pre_sale ? 'left-5' : 'left-1'}`}></div>
                   </button>
                </div>

                <div className="flex items-center justify-end">
                   <button 
                     className="w-10 h-10 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center border border-red-600/20"
                     onClick={() => handleUpdate(item.product_id, 0, item.store_price || 0, item.pre_sale)}
                     title="Remover do estoque (Zerado)"
                   >
                     <i className="fas fa-trash-can text-sm"></i>
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
