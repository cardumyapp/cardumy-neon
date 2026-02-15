
import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MOCK_STORES } from '../constants';
import { Product, ProductType, StoreEvent } from '../types';

interface EventDetailsProps {
  onAddToCart: (product: Product) => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ onAddToCart }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { event, store } = useMemo(() => {
    for (const s of MOCK_STORES) {
      const e = s.events?.find(ev => ev.id === id);
      if (e) return { event: e, store: s };
    }
    return { event: null, store: null };
  }, [id]);

  const handleBuyTicket = () => {
    if (!event || !store) return;
    const ticketProduct: Product = {
      id: event.id,
      slug: event.id,
      name: `Ingresso: ${event.name}`,
      type: ProductType.TICKET,
      price: event.price,
      imageUrl: event.imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=300',
      storeName: store.name,
      storeId: store.id,
      isOfficialPartner: store.isPartner,
      game: event.game,
      stock: event.totalSpots - event.filledSpots
    };
    onAddToCart(ticketProduct);
    navigate('/carrinho');
  };

  if (!event || !store) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <i className="fas fa-calendar-xmark text-6xl text-slate-800"></i>
        <h2 className="text-2xl font-bold text-slate-500">Evento não encontrado</h2>
        <Link to="/lojas" className="text-purple-400 hover:underline">Explorar lojas e eventos</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back Button */}
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="bg-slate-900/50 hover:bg-slate-800 text-slate-400 px-4 py-2 rounded-xl border border-slate-800 text-xs font-bold transition-all flex items-center space-x-2"
        >
          <i className="fas fa-arrow-left"></i>
          <span>Voltar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Header Card */}
          <section className="relative rounded-[48px] overflow-hidden border border-slate-800 shadow-2xl h-96">
            <img 
              src={event.imageUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200"} 
              className="w-full h-full object-cover brightness-[0.4]" 
              alt={event.name} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
            
            <div className="absolute bottom-12 left-12 right-12 space-y-4">
               <div className="flex items-center space-x-3">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md ${event.type === 'Prerelease' ? 'bg-orange-600/20 text-orange-400' : 'bg-pink-600/20 text-pink-400'}`}>
                    {event.type}
                  </span>
                  <span className="bg-white/10 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10 backdrop-blur-md">
                    {event.game}
                  </span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tight">{event.name}</h1>
            </div>
          </section>

          {/* Description & Rules */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-[40px] p-10 space-y-10">
            <div className="space-y-4">
              <h3 className="text-xl font-black text-white flex items-center">
                <span className="w-1.5 h-6 bg-purple-600 rounded-full mr-3"></span>
                Sobre o Evento
              </h3>
              <p className="text-slate-400 leading-relaxed text-lg italic">
                {event.description || "Participe de um dos eventos mais emocionantes do nosso calendário. Competitividade, diversão e prêmios incríveis esperam por você!"}
              </p>
            </div>

            <div className="h-px bg-slate-800/50 w-full"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                 <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Formato de Jogo</h4>
                 <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex items-center space-x-5">
                    <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 text-xl">
                       <i className="fas fa-scroll"></i>
                    </div>
                    <div>
                       <p className="text-white font-black text-lg">Padrão Oficial</p>
                       <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{event.game} Global Rules</p>
                    </div>
                 </div>
               </div>

               <div className="space-y-6">
                 <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Regras & Detalhes</h4>
                 <ul className="space-y-4">
                    {[
                      'Decks de 60 cartas conforme regras vigentes',
                      'Rodadas de 45 minutos (Suiço)',
                      'Corte para TOP 4 ou TOP 8 (dependendo do número de inscritos)',
                      'Premiação: Kits Store Champ + Boosters EB-01'
                    ].map((rule, idx) => (
                      <li key={idx} className="flex items-start space-x-3 text-sm text-slate-400">
                        <i className="fas fa-check-circle text-emerald-500 mt-1"></i>
                        <span>{rule}</span>
                      </li>
                    ))}
                 </ul>
               </div>
            </div>
          </section>
        </div>

        {/* Info Column (Checkout) */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-10 sticky top-8 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600"></div>
              
              <div className="space-y-6">
                 <div className="flex items-center space-x-4">
                    <img src={store.logo} className="w-12 h-12 rounded-xl border border-white/10" alt={store.name} />
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loja Organizadora</p>
                       <h4 className="font-bold text-white leading-none">{store.name}</h4>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center space-x-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                       <i className="far fa-calendar-alt text-pink-500 text-lg"></i>
                       <div>
                          <p className="text-[10px] font-black text-slate-600 uppercase">Data e Hora</p>
                          <p className="text-sm font-bold text-slate-200">{event.date} • 14:00h</p>
                       </div>
                    </div>
                    <div className="flex items-center space-x-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                       <i className="fas fa-location-dot text-emerald-500 text-lg"></i>
                       <div>
                          <p className="text-[10px] font-black text-slate-600 uppercase">Localização</p>
                          <p className="text-sm font-bold text-slate-200">{store.location}</p>
                       </div>
                    </div>
                    <div className="flex items-center space-x-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                       <i className="fas fa-users text-blue-500 text-lg"></i>
                       <div>
                          <p className="text-[10px] font-black text-slate-600 uppercase">Capacidade</p>
                          <p className="text-sm font-bold text-slate-200">{event.totalSpots - event.filledSpots} de {event.totalSpots} vagas disponíveis</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-800 space-y-6">
                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Preço do Ingresso</p>
                       <p className="text-4xl font-black text-white">R$ {event.price}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Pagamento Seguro</p>
                       <div className="flex space-x-1 justify-end">
                          <i className="fab fa-cc-visa text-slate-600"></i>
                          <i className="fab fa-cc-mastercard text-slate-600"></i>
                          <i className="fas fa-qrcode text-slate-600"></i>
                       </div>
                    </div>
                 </div>

                 <button 
                  onClick={handleBuyTicket}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-purple-600/20 active:scale-[0.98] flex items-center justify-center space-x-3"
                 >
                    <i className="fas fa-ticket-simple"></i>
                    <span>Comprar Ingresso</span>
                 </button>
                 
                 <p className="text-[9px] text-slate-600 text-center font-bold uppercase tracking-widest leading-relaxed">
                    Cancelamento gratuito até 24h antes do evento.<br/>Sujeito aos termos de uso da plataforma.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
