
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_STORES, MOCK_PRODUCTS } from '../constants';
import { ProductType, Product } from '../types';

interface StoreProfileProps {
  onAddToCart: (product: Product) => void;
}

export const StoreProfile: React.FC<StoreProfileProps> = ({ onAddToCart }) => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'home' | 'events' | 'products' | 'reviews'>('home');
  
  const store = MOCK_STORES.find(s => s.id === id);
  const storeProducts = MOCK_PRODUCTS.filter(p => p.storeId === id);

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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Store Header */}
      <div className="relative">
        <div className="h-48 md:h-72 w-full rounded-3xl overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200" 
            className="w-full h-full object-cover" 
            alt="Store Cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        </div>

        {/* Profile Info Overlap */}
        <div className="absolute -bottom-12 left-6 md:left-12 flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-8 w-full md:w-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-25"></div>
            <img 
              src={store.logo} 
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-slate-950 shadow-2xl object-cover bg-slate-800" 
              alt={store.name} 
            />
          </div>

          <div className="text-center md:text-left pb-2">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-1">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">{store.name}</h1>
              {store.isPartner && <i className="fas fa-circle-check text-blue-400 text-xl" title="Parceiro Oficial"></i>}
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-4 text-slate-400 text-sm">
              <span className="flex items-center space-x-1">
                <i className="fas fa-location-dot text-pink-500"></i>
                <span>{store.location}</span>
              </span>
              <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
              <span className="flex items-center space-x-1">
                <i className="fas fa-star text-amber-500"></i>
                <span className="text-white font-bold">4.9</span>
                <span className="text-slate-500">(128 avaliações)</span>
              </span>
            </div>
          </div>

          <div className="md:ml-auto md:pb-4 flex space-x-3">
             <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center space-x-2">
               <i className="fab fa-whatsapp"></i>
               <span>WhatsApp</span>
             </a>
             <button className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-2xl transition-all border border-slate-700">
               <i className="fas fa-share-nodes"></i>
             </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-1 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 sticky top-4 z-30 backdrop-blur-md">
        {(['home', 'events', 'products', 'reviews'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'home' ? 'Sobre' : tab === 'events' ? 'Eventos' : tab === 'products' ? 'Loja' : 'Avaliações'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-8 space-y-8">
          
          {activeTab === 'home' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-3xl space-y-4">
                <h3 className="text-xl font-bold text-white">Sobre a Loja</h3>
                <p className="text-slate-400 leading-relaxed">
                  A {store.name} é o ponto de encontro definitivo para jogadores de TCG em {store.location}. 
                  Contamos com um amplo espaço para jogos, estoque variado de cartas avulsas e os últimos lançamentos do mercado. 
                  Nosso compromisso é fortalecer a comunidade local com eventos diários e um ambiente acolhedor.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                   <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Fundação</p>
                      <p className="text-sm font-bold text-white">2018</p>
                   </div>
                   <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Capacidade</p>
                      <p className="text-sm font-bold text-white">40 Jogadores</p>
                   </div>
                   <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Estoque</p>
                      <p className="text-sm font-bold text-white">50k+ Cartas</p>
                   </div>
                   <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Eventos</p>
                      <p className="text-sm font-bold text-white">5/semana</p>
                   </div>
                </div>
              </div>

              {/* Gallery Section */}
              <div className="grid grid-cols-3 gap-4">
                 <img src="https://picsum.photos/seed/store1/400/300" className="rounded-2xl h-40 w-full object-cover border border-slate-800" alt="Gallery" />
                 <img src="https://picsum.photos/seed/store2/400/300" className="rounded-2xl h-40 w-full object-cover border border-slate-800" alt="Gallery" />
                 <img src="https://picsum.photos/seed/store3/400/300" className="rounded-2xl h-40 w-full object-cover border border-slate-800" alt="Gallery" />
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-bold text-white">Calendário de Torneios</h3>
              <div className="grid grid-cols-1 gap-4">
                {store.schedule.map((event, idx) => (
                  <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-purple-500/50 transition-all">
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-950 flex flex-col items-center justify-center border border-slate-800 text-purple-400">
                        <span className="text-xs font-black uppercase tracking-tighter">{event.day.slice(0, 3)}</span>
                        <span className="text-lg font-black leading-none">{event.time}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">{event.game} - Semanal</h4>
                        <p className="text-sm text-slate-500">Inscrições presenciais ou via Marketplace.</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-500 uppercase">Inscrição</p>
                         <p className="text-emerald-400 font-bold">{event.fee || 'Gratuito'}</p>
                      </div>
                      <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg">Garantir Vaga</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
              {storeProducts.length > 0 ? (
                storeProducts.map(product => (
                  <div key={product.id} className="bg-slate-900/40 rounded-3xl border border-slate-800 overflow-hidden flex flex-col group hover:border-purple-500 transition-all">
                    <div className="aspect-square p-4">
                      <img src={product.imageUrl} className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform" alt={product.name} />
                    </div>
                    <div className="p-6 pt-2 flex-1 flex flex-col">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{product.type}</span>
                      <h4 className="font-bold text-white text-sm line-clamp-2 h-10 mb-4">{product.name}</h4>
                      <div className="mt-auto">
                        <p className="text-lg font-black text-emerald-400 mb-4">R$ {product.price.toFixed(2)}</p>
                        <button 
                          onClick={() => onAddToCart(product)}
                          className="w-full bg-slate-800 hover:bg-purple-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all border border-white/5"
                        >
                          Adicionar ao Carrinho
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-slate-600">
                  <i className="fas fa-box-open text-4xl mb-4"></i>
                  <p>Nenhum produto listado nesta loja no momento.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Avaliações da Comunidade</h3>
                  <button className="text-purple-400 text-sm font-bold hover:underline">Escrever Avaliação</button>
               </div>
               <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl space-y-4">
                       <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                             <img src={`https://i.pravatar.cc/150?u=user${i}`} className="w-10 h-10 rounded-full" alt="Reviewer" />
                             <div>
                                <p className="text-sm font-bold text-white">Jogador {i}</p>
                                <div className="flex text-amber-500 text-[10px]">
                                   {[...Array(5)].map((_, j) => <i key={j} className="fas fa-star"></i>)}
                                </div>
                             </div>
                          </div>
                          <span className="text-xs text-slate-600">Há {i * 2} dias</span>
                       </div>
                       <p className="text-sm text-slate-400 italic">"Excelente atendimento e o espaço para jogo é sensacional. Recomendo para todos os amantes de TCG!"</p>
                    </div>
                  ))}
               </div>
            </div>
          )}

        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-4 space-y-8">
           {/* Store Contact & Social */}
           <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 space-y-6">
              <div>
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Horário de Funcionamento</h4>
                 <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-300">
                       <span>Segunda - Sexta</span>
                       <span className="font-bold text-white">10h - 22h</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                       <span>Sábado</span>
                       <span className="font-bold text-white">10h - 20h</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                       <span>Domingo</span>
                       <span className="font-bold text-white">14h - 19h</span>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-800 space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Localização</h4>
                 <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 group cursor-pointer overflow-hidden relative h-32">
                    <img src="https://picsum.photos/seed/map/400/200" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-1000" alt="Map" />
                    <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-2">
                       <i className="fas fa-location-dot text-pink-500"></i>
                       <span className="text-xs text-slate-300 font-medium text-center">{store.location}</span>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-800 space-y-3">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Redes Sociais</h4>
                 <div className="flex space-x-2">
                    <button className="flex-1 bg-slate-950 p-3 rounded-xl hover:text-pink-500 transition-colors border border-slate-800">
                       <i className="fab fa-instagram"></i>
                    </button>
                    <button className="flex-1 bg-slate-950 p-3 rounded-xl hover:text-blue-400 transition-colors border border-slate-800">
                       <i className="fab fa-facebook"></i>
                    </button>
                    <button className="flex-1 bg-slate-950 p-3 rounded-xl hover:text-white transition-colors border border-slate-800">
                       <i className="fab fa-x-twitter"></i>
                    </button>
                 </div>
              </div>
           </div>

           {/* Store Partner CTA */}
           {!store.isPartner && (
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-8 rounded-3xl border border-purple-500/30 text-center space-y-4">
                 <i className="fas fa-rocket text-3xl text-purple-400"></i>
                 <h4 className="font-bold text-white">Loja Verificada</h4>
                 <p className="text-xs text-slate-400">Torne esta loja uma parceira oficial para desbloquear vendas diretas no Marketplace.</p>
                 <button className="text-purple-400 text-xs font-bold hover:underline">Entrar em contato</button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
