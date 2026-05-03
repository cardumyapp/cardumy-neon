import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useAuth } from '../components/AuthProvider';
import { getTournamentDetails } from '../services/supabaseService';
import { useNotification } from '../components/NotificationProvider';

interface EventDetailsProps {
  onAddToCart: (product: Product) => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ onAddToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isLojista = user?.role_id === 6;

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setLoading(true);
      const data = await getTournamentDetails(id);
      if (data) {
        setEvent(data);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  const handleBuyTicket = () => {
    if (!event || !event.tickets?.[0]) {
        showNotification("Este torneio não possui ingressos à venda.", "error");
        return;
    }
    
    const ticketInfo = event.tickets[0];
    const product = ticketInfo.product;
    const storeId = product.store_id || product.stores?.[0]?.store_id;

    if (!storeId) {
        showNotification("Erro ao localizar loja de venda.", "error");
        return;
    }

    onAddToCart({
        id: product.id,
        name: product.name,
        price: product.mspr || product.msrp || product.price,
        image_url: product.image_url,
        storeId: storeId,
        quantity: 1,
        type: 'Ingresso'
    } as any);

    showNotification("Ingresso adicionado ao carrinho!", "success");
    navigate('/carrinho');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );

  if (!event) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-white">Torneio não encontrado</h2>
      <Link to="/torneios" className="text-purple-400 mt-4 block">Voltar para torneios</Link>
    </div>
  );

  const mainTicket = event.tickets?.[0];
  const isSoldOut = mainTicket && mainTicket.sold_quantity >= mainTicket.max_quantity;
  const saleEnded = mainTicket && new Date() > new Date(mainTicket.sale_end);
  const saleNotStarted = mainTicket && new Date() < new Date(mainTicket.sale_start);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="relative h-[400px] rounded-3xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10"></div>
        <img 
            src={event.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200'} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
            alt={event.name} 
        />
        
        <div className="absolute bottom-0 inset-x-0 p-8 md:p-12 z-20 space-y-4">
          <div className="flex flex-wrap gap-3">
             <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                 event.status === 'open' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
             }`}>
                 {event.status === 'open' ? 'Inscrições Abertas' : event.status === 'scheduled' ? 'Em Breve' : 'Finalizado'}
             </span>
             <span className="bg-slate-900/80 backdrop-blur-md text-slate-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">
                 {event.cardgames?.name}
             </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">{event.name}</h1>
          <div className="flex flex-wrap items-center gap-6 text-slate-300">
             <div className="flex items-center space-x-2">
               <i className="fas fa-calendar-alt text-purple-400"></i>
               <span className="text-sm font-bold">
                   {new Date(event.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
               </span>
             </div>
             <div className="flex items-center space-x-2">
               <i className="fas fa-location-dot text-purple-400"></i>
               <span className="text-sm font-bold">{event.location || 'Local da Loja'}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">Sobre o Evento</h2>
            <p className="text-slate-400 leading-relaxed">
                {event.description || 'Nenhuma descrição fornecida para este evento.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-2">
              <i className="fas fa-award text-2xl text-yellow-500 mb-2"></i>
              <h4 className="font-bold text-white">Formato</h4>
              <p className="text-xs text-slate-500">{event.tournament_formats?.name || 'Não definido'}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-2">
              <i className="fas fa-users text-2xl text-blue-400 mb-2"></i>
              <h4 className="font-bold text-white">Vagas</h4>
              <p className="text-xs text-slate-500">{mainTicket?.sold_quantity || 0} de {event.max_players} preenchidas.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8 sticky top-24">
             {mainTicket ? (
                 <>
                    <div>
                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Valor da Inscrição</p>
                    <div className="flex items-end space-x-2">
                        <span className="text-4xl font-black text-emerald-400">R$ {(mainTicket.product?.mspr || mainTicket.product?.msrp || 0).toFixed(2)}</span>
                        <span className="text-slate-500 text-xs font-bold mb-1.5">/ ingresso</span>
                    </div>
                    </div>

                    <div className="space-y-3">
                    {!isLojista ? (
                        <button 
                        onClick={handleBuyTicket}
                        disabled={isSoldOut || saleEnded || saleNotStarted || event.status !== 'open'}
                        className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-4 rounded-xl shadow-xl shadow-purple-600/20 transition-all active:scale-95 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:grayscale`}
                        >
                        <i className="fas fa-ticket text-sm"></i>
                        <span>
                            {isSoldOut ? 'Esgotado' : saleEnded ? 'Vendas Encerradas' : saleNotStarted ? 'Em Breve' : 'Garantir Vaga'}
                        </span>
                        </button>
                    ) : (
                        <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl text-center">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Lojistas não podem adquirir ingressos.
                        </p>
                        </div>
                    )}
                    <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <i className="fas fa-lock"></i>
                        <span>Pagamento 100% Seguro</span>
                    </div>
                    </div>
                 </>
             ) : (
                <div className="text-center py-4">
                    <p className="text-sm font-bold text-slate-400">Este evento não vende ingressos online.</p>
                    <Link to="/torneios" className="text-xs text-purple-400 hover:underline mt-2 inline-block">Ver outros eventos</Link>
                </div>
             )}

             <div className="pt-8 border-t border-slate-800 space-y-4">
                <p className="text-xs font-bold text-white">Organizado por:</p>
                <div className="flex items-center space-x-3">
                    <img src={event.creator?.avatar || "https://i.pravatar.cc/150?u=lojista"} className="w-10 h-10 rounded-full border border-purple-500/30" alt="Organizador" />
                    <div>
                        <p className="text-xs font-black text-white uppercase italic tracking-tight">{event.creator?.username || event.creator?.codename || 'Organizador'}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Lojista Parceiro</p>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
