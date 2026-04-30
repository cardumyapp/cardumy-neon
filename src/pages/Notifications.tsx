
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/supabaseService';
import { useNotification } from '../components/NotificationProvider';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifs();
  }, []);

  const fetchNotifs = async () => {
    setLoading(true);
    const data = await getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAsRead = async (id: number, url?: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    if (url) {
      if (url.startsWith('http')) {
        window.open(url, '_blank');
      } else {
        navigate(url);
      }
    }
  };

  const handleReadAll = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      showNotification("Todas as notificações marcadas como lidas", "success");
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Carregando notificações...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Notificações</h1>
        {notifications.some(n => !n.is_read) && (
            <button 
                onClick={handleReadAll}
                className="text-[10px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest border border-purple-400/20 px-3 py-1.5 rounded-lg transition-all"
            >
                Marcar todas como lidas
            </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <motion.div 
            key={notif.id}
            onClick={() => handleMarkAsRead(notif.id, notif.url)}
            className={`p-6 rounded-2xl border transition-all cursor-pointer group ${
              !notif.is_read 
                ? 'bg-purple-600/5 border-purple-500/30 hover:border-purple-500/60' 
                : 'bg-slate-900/50 border-slate-800 text-slate-500 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{notif.type || 'SISTEMA'}</span>
                </div>
                <p className={`text-sm leading-relaxed ${!notif.is_read ? 'text-white' : 'text-slate-400'}`}>
                    {notif.message}
                </p>
                <p className="text-[10px] uppercase font-bold tracking-widest pt-2 text-slate-600">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              {!notif.is_read && (
                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full shrink-0 mt-2 shadow-lg shadow-purple-500/50 group-hover:scale-125 transition-transform"></div>
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
          <p className="text-slate-500">Você não tem notificações no momento.</p>
        </div>
      )}
    </div>
  );
};
