
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../src/components/AuthProvider';
import { getUserProfile } from '../src/services/supabaseService';

export const Profile: React.FC = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      if (userId) {
        // Fetch specific user
        const data = await getUserProfile(userId);
        if (data) {
          setProfileUser(data);
        }
      } else if (currentUser) {
        // Show current user (own profile)
        const data = await getUserProfile(currentUser.id);
        if (data) {
          setProfileUser(data);
        } else {
          // Fallback to auth user if doc doesn't exist yet
          setProfileUser({
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            email: currentUser.email,
            id: currentUser.id,
            codename: currentUser.displayName || 'Usuário',
            username: currentUser.displayName?.split(' ')[0].toLowerCase() || 'user'
          });
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId, currentUser]);

  const stats = [
    { label: 'Coleção', value: '1.248', icon: 'fa-box-archive', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Wishlist', value: '42', icon: 'fa-heart', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'Seguidores', value: '850', icon: 'fa-users', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Seguindo', value: '124', icon: 'fa-user-plus', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  const badges = [
    { name: 'Fundador', icon: 'fa-award', color: 'text-amber-400' },
    { name: 'Colecionador Pro', icon: 'fa-gem', color: 'text-blue-400' },
    { name: 'Top 100', icon: 'fa-crown', color: 'text-yellow-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Usuário não encontrado</h2>
        <p className="text-slate-400 mt-2">O perfil que você está procurando não existe ou foi removido.</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-12 animate-in fade-in duration-500">
      {/* Hero Section / Cover */}
      <div className="relative mb-32 md:mb-32">
        <div className="h-40 md:h-64 w-full rounded-2xl md:rounded-3xl overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200" 
            className="w-full h-full object-cover" 
            alt="Cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
          
          <button className="absolute top-3 right-3 md:top-4 md:right-4 bg-slate-900/60 backdrop-blur-md hover:bg-slate-900 text-white p-2 md:px-3 md:py-2 rounded-full md:rounded-xl transition-all text-[10px] border border-white/10">
            <i className="fas fa-camera md:mr-2"></i> <span className="hidden md:inline">Alterar Capa</span>
          </button>
        </div>

        {/* Profile Info Overlap */}
        <div className="absolute -bottom-24 md:-bottom-20 left-0 right-0 md:left-12 flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-8 px-4 md:px-0">
          <div className="relative group flex-shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            <img 
              src={profileUser.avatar || profileUser.photoURL || "https://i.pravatar.cc/300?u=victoria"} 
              className="relative w-28 h-28 md:w-40 md:h-40 rounded-full border-4 border-slate-950 shadow-2xl object-cover bg-slate-900" 
              alt="Profile" 
            />
            <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-green-500 w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-slate-950 shadow-lg" title="Online"></div>
          </div>

          <div className="text-center md:text-left flex-1 min-w-0 pb-1">
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-1">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-tight truncate">{profileUser.codename || profileUser.displayName}</h1>
              <i className="fas fa-circle-check text-blue-400 text-sm md:text-xl" title="Verificada"></i>
            </div>
            <p className="text-slate-400 text-xs md:text-sm font-medium mb-3">@{profileUser.username} • {profileUser.role === 'admin' ? 'Administrador' : 'Colecionador Lendário'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 md:gap-2">
              {badges.map(badge => (
                <span key={badge.name} className="flex items-center space-x-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  <i className={`fas ${badge.icon} ${badge.color}`}></i>
                  <span>{badge.name}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex md:ml-auto md:pb-4 space-x-2 w-full md:w-auto justify-center md:justify-start px-4 md:px-0">
             {isOwnProfile ? (
               <button className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg text-xs md:text-sm active:scale-95">
                 Editar Perfil
               </button>
             ) : (
               <button className="flex-1 md:flex-none bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg text-xs md:text-sm active:scale-95">
                 Seguir
               </button>
             )}
             <button className="bg-slate-800 hover:bg-slate-700 text-white w-10 h-10 flex items-center justify-center rounded-xl transition-all border border-slate-700">
               <i className="fas fa-share-nodes text-sm"></i>
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 px-4 md:px-0">
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {stats.map(stat => (
              <div key={stat.label} className="bg-slate-900/50 backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group cursor-default">
                <div className={`${stat.bg} ${stat.color} w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 text-sm md:text-lg group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <p className="text-lg md:text-2xl font-black text-white">{stat.value}</p>
                <p className="text-slate-500 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/30 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-4">
            <h3 className="text-lg md:text-xl font-bold flex items-center space-x-2">
              <i className="fas fa-user-pen text-purple-500 text-sm md:text-base"></i>
              <span>Bio</span>
            </h3>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              Mestre Pokémon e entusiasta de Digimon. Atualmente focado em completar o set clássico de base set. Sempre aberto para propostas de troca justas! 🃏✨
            </p>

            {/* RE-ADDED: Redes Sociais no Perfil */}
            <div className="flex items-center space-x-4 pt-4">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conectar:</span>
               <div className="flex space-x-3">
                  <a href="#" className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-pink-500 hover:border-pink-500/30 transition-all"><i className="fab fa-instagram"></i></a>
                  <a href="#" className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-400/30 transition-all"><i className="fab fa-twitter"></i></a>
                  <a href="#" className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:border-indigo-400/30 transition-all"><i className="fab fa-discord"></i></a>
               </div>
            </div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
            <h3 className="text-lg md:text-xl font-bold flex items-center space-x-2">
              <i className="fas fa-bolt text-purple-500 text-sm md:text-base"></i>
              <span>Atividade Recente</span>
            </h3>
            <div className="space-y-4">
              {[
                { action: 'Adicionou a carta', target: 'ST12-12', date: 'Há 2 horas' },
                { action: 'Criou o deck', target: 'Zoro Aggro', date: 'Há 5 horas' },
                { action: 'Seguiu', target: 'Matrona TCG', date: 'Ontem' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-none">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <p className="text-sm text-slate-300">
                      {activity.action} <span className="text-white font-bold">{activity.target}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{activity.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <div className="bg-slate-900/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 space-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Link do Perfil</h4>
              <div className="relative group">
                <input 
                  type="text" 
                  readOnly 
                  value={`cardumy.com/${profileUser.username}`} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-xs md:text-sm font-mono text-purple-400 focus:outline-none"
                />
                <button className="absolute right-2 top-2 bottom-2 bg-slate-800 hover:bg-slate-700 px-3 rounded-lg text-slate-300 transition-colors">
                  <i className="fas fa-copy text-sm"></i>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-center flex flex-col items-center">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 text-left w-full">QR de Trocas</h4>
              <div className="bg-white p-3 md:p-4 inline-block rounded-xl md:rounded-2xl shadow-xl shadow-white/5 group hover:scale-105 transition-transform duration-500">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://cardumy.com/perfil/${profileUser.id}&bgcolor=ffffff&color=0f172a`} 
                  className="w-28 h-28 md:w-36 md:h-36" 
                  alt="QR Code" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
