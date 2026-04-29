
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Product } from '../types';

interface EventDetailsProps {
  onAddToCart: (product: Product) => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ onAddToCart }) => {
  const { id } = useParams();

  // Mock event data
  const event = {
    id,
    name: 'Regional TCG Championship 2026',
    date: '15 Mai 2026',
    time: '09:00',
    location: 'Centro de Convenções Cardumy',
    description: 'O maior torneio regional do ano! Venha disputar a glória e prêmios incríveis em uma atmosfera épica.',
    price: 85.00,
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="relative h-[400px] rounded-3xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10"></div>
        <img src={event.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={event.name} />
        
        <div className="absolute bottom-0 inset-x-0 p-8 md:p-12 z-20 space-y-4">
          <div className="flex flex-wrap gap-3">
             <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Inscrições Abertas</span>
             <span className="bg-slate-900/80 backdrop-blur-md text-slate-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">Torneio Presencial</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">{event.name}</h1>
          <div className="flex flex-wrap items-center gap-6 text-slate-300">
             <div className="flex items-center space-x-2">
               <i className="fas fa-calendar-alt text-purple-400"></i>
               <span className="text-sm font-bold">{event.date} às {event.time}</span>
             </div>
             <div className="flex items-center space-x-2">
               <i className="fas fa-location-dot text-purple-400"></i>
               <span className="text-sm font-bold">{event.location}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">Sobre o Evento</h2>
            <p className="text-slate-400 leading-relaxed">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-2">
              <i className="fas fa-award text-2xl text-yellow-500 mb-2"></i>
              <h4 className="font-bold text-white">Premiação Garantida</h4>
              <p className="text-xs text-slate-500">Mais de R$ 5.000,00 em créditos na loja e boosters exclusivos.</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-2">
              <i className="fas fa-shield-halved text-2xl text-blue-400 mb-2"></i>
              <h4 className="font-bold text-white">Ambiente Seguro</h4>
              <p className="text-xs text-slate-500">Juízes certificados e estrutura profissional de suporte.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8 sticky top-24">
             <div>
               <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Valor da Inscrição</p>
               <div className="flex items-end space-x-2">
                  <span className="text-4xl font-black text-emerald-400">R$ {(event.price || 0).toFixed(2)}</span>
                  <span className="text-slate-500 text-xs font-bold mb-1.5">/ ingresso</span>
               </div>
             </div>

             <div className="space-y-3">
                <button 
                  onClick={() => onAddToCart({ id: event.id!, name: event.name, price: event.price, type: 'Ingresso' } as any)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-4 rounded-xl shadow-xl shadow-purple-600/20 transition-all active:scale-95 flex items-center justify-center space-x-3"
                >
                  <i className="fas fa-ticket text-sm"></i>
                  <span>Garantir Vaga</span>
                </button>
                <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                   <i className="fas fa-lock"></i>
                   <span>Pagamento 100% Seguro</span>
                </div>
             </div>

             <div className="pt-8 border-t border-slate-800 space-y-4">
                <p className="text-xs font-bold text-white">Recursos Inclusos:</p>
                <ul className="space-y-3">
                   {['Entrada antecipada', '2 Boosters na entrada', 'Kit de boas-vindas', 'Água e Snacks'].map(f => (
                     <li key={f} className="flex items-center space-x-3 text-xs text-slate-400 font-medium">
                        <i className="fas fa-check text-emerald-400 text-[10px]"></i>
                        <span>{f}</span>
                     </li>
                   ))}
                </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
