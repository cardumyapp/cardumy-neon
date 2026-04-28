
import React from 'react';
import { motion } from 'motion/react';

export const Notifications: React.FC = () => {
  const notifications = [
    { id: 1, title: 'Bem-vindo ao Cardumy!', message: 'Explore as pastas e organize sua coleção.', date: 'Há 5 min', isNew: true },
    { id: 2, title: 'Nova Oferta Encontrada', message: 'A carta que você queria está disponível na Loja Alpha.', date: 'Há 2 horas', isNew: true },
    { id: 3, title: 'Inscrição Confirmada', message: 'Sua vaga no Regional Championship está garantida.', date: 'Ontem', isNew: false }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white">Notificações</h1>
        <button className="text-xs font-bold text-purple-400 hover:text-purple-300">Marcar todas como lidas</button>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <motion.div 
            key={notif.id}
            className={`p-6 rounded-2xl border transition-all ${
              notif.isNew 
                ? 'bg-purple-600/5 border-purple-500/30' 
                : 'bg-slate-900/50 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className={`font-bold ${notif.isNew ? 'text-white' : 'text-slate-400'}`}>{notif.title}</h3>
                <p className="text-sm leading-relaxed">{notif.message}</p>
                <p className="text-[10px] uppercase font-black tracking-widest pt-2">{notif.date}</p>
              </div>
              {notif.isNew && (
                <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0 mt-2 shadow-lg shadow-purple-500/50"></div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="py-24 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
            <i className="fas fa-bell-slash text-2xl"></i>
          </div>
          <p className="text-slate-500">Você não tem novas notificações no momento.</p>
        </div>
      )}
    </div>
  );
};
