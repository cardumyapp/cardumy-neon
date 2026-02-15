
import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MOCK_STORES, MOCK_PRODUCTS } from '../constants';
import { ProductType, Product, StoreEvent } from '../types';

interface StoreProfileProps {
  onAddToCart: (product: Product) => void;
}

type TabType = 'home' | 'agenda' | 'events' | 'products' | 'reviews';

const DAY_ORDER = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const StoreProfile: React.FC<StoreProfileProps> = ({ onAddToCart }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  
  const store = MOCK_STORES.find(s => s.id === id);
  const storeProducts = MOCK_PRODUCTS.filter(p => p.storeId === id);

  const sortedSchedule = useMemo(() => {
    if (!store) return [];
    return [...store.schedule].sort((a, b) => {
      return DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
    });
  }, [store]);

  const highlightedEvent = useMemo(() => {
    return store?.events?.find(e => e.isHighlighted) || store?.events?.[0];
  }, [store]);

  const standardEvents = useMemo(() => {
    return store?.events?.filter(e => !e.isHighlighted) || [];
  }, [store]);

  const handleBuyTicket = (ev: StoreEvent) => {
    if (!store) return;
    const ticketProduct: Product = {
      id: ev.id,
      slug: ev.id,
      name: `Ingresso: ${ev.name}`,
      type: ProductType.TICKET,
      price: ev.price,
      imageUrl: ev.imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=300',
      storeName: store.name,
      storeId: store.id,
      isOfficialPartner: store.isPartner,
      game: ev.game,
      stock: ev.totalSpots - ev.filledSpots
    };
    onAddToCart(ticketProduct);
    navigate('/carrinho');
  };

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <i className="fas fa-store-slash text-6xl text-slate-800"></i>
        <h2 className="text-2xl font-bold text-slate-500">Loja não encontrada</h2>
        <Link to="/lojas" className="text-purple-400 hover:underline">Voltar para lista de lojas</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20 md:pb-8">
      {/* Top Nav Buttons */}
      <div className="flex items-center justify-between">
        <Link to="/lojas" className="bg-slate-900/50 hover:bg-slate-800 text-slate-400 px-3 md:px-4 py-2 rounded-xl border border-slate-800 text-[10px] md:text-xs font-bold transition-all flex items-center space-x-2">
          <i className="fas fa-arrow-left"></i>
          <span>Explorar Lojas</span>
        </Link>
        <div className="flex space-x-2">
          <button className="w-9 h-9 md:w-10 md:h-10 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500">
            <i className="fas fa-heart text-sm md:text-base"></i>
          </button>
          <button className="w-9 h-9 md:w-10 md:h-10 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500">
            <i className="fas fa-share-nodes text-sm md:text-base"></i>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="relative rounded-2xl md:rounded-[40px] overflow-hidden border border-slate-800 shadow-2xl h-[300px] md:h-[450px]">
        <img 
          src="https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=1200" 
          className="w-full h-full object-cover brightness-[0.4]" 
          alt="Store Banner" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        
        {/* Banner Overlay Info */}
        <div className="absolute bottom-4 md:bottom-10 left-4 md:left-10 right-4 md:right-10 flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-8">
          <div className="relative hidden md:block">
             <img 
               src={store.logo} 
               className="relative w-32 h-32 md:w-44 md:h-44 rounded-[28px] md:rounded-[32px] border-4 border-white object-cover bg-slate-900 shadow-2xl" 
               alt={store.name} 
             />
          </div>
          <div className="flex-1 space-y-3 md:space-y-4 pb-2">
             <div className="flex items-center space-x-3 md:space-x-4">
                <h1 className="text-2xl md:text-6xl font-black tracking-tight text-white">{store.name}</h1>
                {store.isPartner && (
                  <span className="bg-yellow-500 text-slate-950 text-[8px] md:text-[10px] font-black px-3 md:px-4 py-1 rounded-full uppercase tracking-widest">
                    P
                  </span>
                )}
             </div>
             
             <div className="space-y-3 md:space-y-4">
               <div className="flex items-center space-x-2 text-white/90 text-xs md:text-sm font-bold">
                  <i className="fas fa-location-dot text-purple-400"></i>
                  <span>{store.location}</span>
               </div>

               <div className="flex flex-wrap gap-2 md:gap-3">
                  <div className="flex items-center space-x-2 md:space-x-3 bg-slate-950/60 backdrop-blur-md px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-white/5">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">Pagamento:</span>
                    <div className="flex items-center space-x-2 md:space-x-4">
                      <span className="flex items-center text-[9px] md:text-[11px] text-slate-200 font-bold"><i className="fas fa-handshake text-purple-400 mr-1.5 md:mr-2"></i>MP</span>
                      <span className="flex items-center text-[9px] md:text-[11px] text-slate-200 font-bold"><i className="fas fa-qrcode text-purple-400 mr-1.5 md:mr-2"></i>Pix</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 md:space-x-3 bg-slate-950/60 backdrop-blur-md px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-white/5">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">Logística:</span>
                    <div className="flex items-center space-x-2 md:space-x-4">
                      <span className="flex items-center text-[9px] md:text-[11px] text-emerald-400 font-bold"><i className="fas fa-store mr-1.5 md:mr-2"></i>Retirada</span>
                      <span className="flex items-center text-[9px] md:text-[11px] text-slate-200 font-bold"><i className="fas fa-truck-fast text-slate-400 mr-1.5 md:mr-2"></i>Frete</span>
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-8 space-y-8 md:space-y-12">
          
          {/* Navigation Tabs - Horizontal Scroll on Mobile */}
          <div className="flex items-center space-x-1 bg-slate-900/30 p-1 rounded-xl md:rounded-2xl border border-slate-800/50 overflow-x-auto scrollbar-hide">
            {(['home', 'agenda', 'events', 'products', 'reviews'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[90px] md:min-w-[100px] py-2 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'home' ? 'Início' : 
                 tab === 'agenda' ? 'Agenda' : 
                 tab === 'events' ? 'Eventos' : 
                 tab === 'products' ? 'Loja' : 'Avaliações'}
              </button>
            ))}
          </div>

          {activeTab === 'home' && (
            <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
              {highlightedEvent && (
                <section className="relative rounded-2xl md:rounded-[32px] overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-purple-500/20 p-6 md:p-8 shadow-2xl">
                   <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
                      <img 
                        src={highlightedEvent.imageUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=300"} 
                        className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-2xl shadow-xl border border-white/5" 
                        alt="Promo"
                      />
                      <div className="flex-1 space-y-3 md:space-y-4">
                         <div className="inline-flex items-center space-x-2 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-purple-400">Oportunidade Única</span>
                         </div>
                         <h3 className="text-2xl md:text-3xl font-black text-white">{highlightedEvent.name}</h3>
                         <p className="text-slate-400 text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                            {highlightedEvent.description}
                         </p>
                         <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                           <button 
                             onClick={() => handleBuyTicket(highlightedEvent)}
                             className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl shadow-lg active:scale-95 text-sm"
                           >
                             Garantir Ingresso
                           </button>
                           <button 
                             onClick={() => navigate(`/evento/${highlightedEvent.id}`)}
                             className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                           >
                             Mais Detalhes
                           </button>
                         </div>
                      </div>
                   </div>
                </section>
              )}

              {/* Tournament Preview - Responsive Rows */}
              <section className="space-y-4 md:space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg md:text-xl font-black text-white flex items-center">
                       <span className="w-1 h-5 md:w-1.5 md:h-6 bg-purple-600 rounded-full mr-2 md:mr-3"></span>
                       Torneios da Semana
                    </h3>
                    <button onClick={() => setActiveTab('agenda')} className="text-[9px] font-bold text-slate-500 hover:text-purple-400 uppercase tracking-widest">Ver Todos</button>
                 </div>
                 
                 <div className="bg-slate-900/40 border border-slate-800 rounded-2xl md:rounded-[32px] overflow-hidden divide-y divide-slate-800/50 shadow-xl">
                    {sortedSchedule.slice(0, 3).map((t, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 hover:bg-slate-900/80 transition-all group">
                         <div className="flex items-center space-x-4 md:space-x-6">
                            <div className="w-20 md:w-24">
                               <span className={`px-2 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest text-center block ${
                                 t.day === 'Domingo' ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-500'
                               }`}>
                                 {t.day}
                               </span>
                            </div>
                            <div>
                               <h4 className="text-sm md:text-base font-bold text-white uppercase tracking-tight">{t.game}</h4>
                               <p className="text-[10px] text-slate-500 flex items-center mt-1">
                                  <i className="far fa-clock mr-2 text-purple-500/70"></i>
                                  <span>{t.time}</span>
                               </p>
                            </div>
                         </div>
                         <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end sm:space-x-8">
                            <div className="text-right">
                               <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase">Inscrição</p>
                               <p className="text-sm md:text-lg font-black text-emerald-400">{t.fee || 'Gratuito'}</p>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </section>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-8">
                  {storeProducts.map((p, i) => (
                     <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-[32px] overflow-hidden flex flex-col group hover:border-purple-500/50 transition-all">
                       <div className="aspect-square p-3 md:p-4 bg-slate-950/20 relative">
                         <img src={p.imageUrl} className="w-full h-full object-contain rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                       </div>
                       <div className="p-3 md:p-6 space-y-2 md:space-y-4">
                         <div>
                           <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{p.type}</p>
                           <h4 className="font-bold text-white text-[10px] md:text-sm line-clamp-2 h-7 md:h-10 transition-colors">{p.name}</h4>
                         </div>
                         <div className="flex justify-between items-center pt-1 md:pt-2">
                           <p className="text-xs md:text-xl font-black text-white">R$ {p.price}</p>
                           <button 
                             onClick={() => onAddToCart(p)}
                             className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 text-white rounded-lg md:rounded-xl flex items-center justify-center transition-all active:scale-90"
                           >
                             <i className="fas fa-plus text-xs md:text-sm"></i>
                           </button>
                         </div>
                       </div>
                     </div>
                   ))}
               </div>
            </div>
          )}
        </div>

        {/* Info Column - Stacked on Mobile */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
           <div className="bg-slate-900/50 border border-slate-800 rounded-[28px] md:rounded-[36px] p-6 md:p-8 space-y-6 md:space-y-8 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-emerald-600"></div>
              
              <h3 className="text-lg md:text-xl font-black text-white">Contato</h3>

              <div className="space-y-4 md:space-y-6">
                 <a href={`https://wa.me/${store.whatsapp}`} target="_blank" className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/20 p-4 md:p-5 rounded-xl md:rounded-2xl transition-all">
                    <div className="flex items-center space-x-3 md:space-x-4">
                       <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl shadow-lg shadow-emerald-600/20">
                          <i className="fab fa-whatsapp"></i>
                       </div>
                       <div>
                          <p className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase">WhatsApp</p>
                          <p className="text-sm md:text-base font-bold text-white">Official Shop</p>
                       </div>
                    </div>
                    <i className="fas fa-chevron-right text-emerald-600 text-xs md:text-base"></i>
                 </a>

                 <div className="flex items-start space-x-3 md:space-x-4 p-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-950 rounded-lg md:rounded-xl flex items-center justify-center text-slate-500 border border-slate-800 flex-shrink-0">
                       <i className="fas fa-location-dot text-sm md:text-base"></i>
                    </div>
                    <div>
                       <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest">Endereço</p>
                       <p className="text-xs md:text-sm font-bold text-slate-300 leading-snug">{store.location}, Jardim da Glória</p>
                       <button className="text-[8px] md:text-[9px] font-black text-purple-400 uppercase mt-2">Traçar Rota →</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
