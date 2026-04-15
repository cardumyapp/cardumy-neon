
import React from 'react';
import { MOCK_NOTIFICATIONS } from '../constants';
import { motion } from 'motion/react';

export const Notifications: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Notificações</h1>
          <p className="text-slate-400 text-sm mt-1">Fique por dentro das novidades e atividades da sua conta.</p>
        </div>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-white/5">
          Marcar todas como lidas
        </button>
      </div>

      <div className="space-y-3">
        {MOCK_NOTIFICATIONS.map((notif, idx) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-4 rounded-xl border transition-all cursor-pointer group ${notif.read ? 'bg-slate-900/40 border-slate-800/50 grayscale-[0.5]' : 'bg-slate-800/40 border-purple-500/30 shadow-lg shadow-purple-500/5'}`}
          >
            <div className="flex items-start space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                notif.type === 'success' ? 'bg-green-500/10 text-green-400' :
                notif.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                notif.type === 'error' ? 'bg-red-500/10 text-red-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>
                <i className={`fas ${
                  notif.type === 'success' ? 'fa-check-circle' :
                  notif.type === 'warning' ? 'fa-triangle-exclamation' :
                  notif.type === 'error' ? 'fa-circle-xmark' :
                  'fa-circle-info'
                }`}></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold text-sm ${notif.read ? 'text-slate-300' : 'text-white'}`}>{notif.title}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">{notif.timestamp}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 shadow-glow shadow-purple-500/50"></div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
