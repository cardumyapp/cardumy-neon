
import React from 'react';

export const Profile: React.FC = () => {
  const stats = [
    { label: 'Coleção', value: '1.248', icon: 'fa-box-archive', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Wishlist', value: '42', icon: 'fa-heart', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'Trocas', value: '15', icon: 'fa-right-left', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Decks', value: '8', icon: 'fa-layers-group', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  const badges = [
    { name: 'Fundador', icon: 'fa-award', color: 'text-amber-400' },
    { name: 'Colecionador Pro', icon: 'fa-gem', color: 'text-blue-400' },
    { name: 'Top 100', icon: 'fa-crown', color: 'text-yellow-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Hero Section / Cover */}
      <div className="relative mb-24 md:mb-32">
        <div className="h-48 md:h-64 w-full rounded-3xl overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200" 
            className="w-full h-full object-cover" 
            alt="Cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
          
          {/* Edit Cover Button */}
          <button className="absolute top-4 right-4 bg-slate-900/60 backdrop-blur-md hover:bg-slate-900 text-white p-2 rounded-full transition-all text-xs border border-white/10">
            <i className="fas fa-camera mr-2"></i> Alterar Capa
          </button>
        </div>

        {/* Profile Info Overlap */}
        <div className="absolute -bottom-16 md:-bottom-20 left-6 md:left-12 flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-8 w-full md:w-auto px-6 md:px-0">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <img 
              src="https://i.pravatar.cc/300?u=victoria" 
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-950 shadow-2xl object-cover" 
              alt="Profile" 
            />
            <div className="absolute bottom-2 right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-slate-950 shadow-lg" title="Online"></div>
          </div>

          <div className="text-center md:text-left pb-2">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-1">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Victoria Pedretti</h1>
              <i className="fas fa-circle-check text-blue-400 text-xl" title="Verificada"></i>
            </div>
            <p className="text-slate-400 font-medium mb-3">@viped • Jogador lendário de Digimon TCG</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {badges.map(badge => (
                <span key={badge.name} className="flex items-center space-x-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  <i className={`fas ${badge.icon} ${badge.color}`}></i>
                  <span>{badge.name}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="md:ml-auto md:pb-4 flex space-x-3">
             <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95">
               Editar Perfil
             </button>
             <button className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl transition-all border border-slate-700">
               <i className="fas fa-share-nodes"></i>
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(stat => (
              <div key={stat.label} className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group cursor-default">
                <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-lg group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* About Section */}
          <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <i className="fas fa-user-pen text-purple-500"></i>
              <span>Sobre mim</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Colecionador desde 2015. Focado em completar o set clássico de Digimon e cartas raras de One Piece. 
              Sempre aberto para trocas justas! Se você tiver um MagnaAngemon holofoil, me dê um alô. 🃏✨
            </p>
          </div>

          {/* Recent Activity Placeholder */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold">Atividade Recente</h3>
                <button className="text-sm text-purple-400 hover:text-purple-300">Ver tudo</button>
             </div>
             <div className="divide-y divide-slate-800">
                {[
                  { action: 'Adicionou à coleção', target: 'WarGreymon BT1-025', time: 'Há 2 horas', img: 'https://picsum.photos/seed/digi1/40/40' },
                  { action: 'Completou o deck', target: 'Red Hybrid Rush', time: 'Há 1 dia', img: 'https://picsum.photos/seed/deck/40/40' },
                  { action: 'Recebeu avaliação', target: '5 estrelas de @ronaldo_f', time: 'Há 3 dias', img: 'https://picsum.photos/seed/user/40/40' },
                ].map((act, i) => (
                  <div key={i} className="p-4 flex items-center space-x-4 hover:bg-slate-800/30 transition-colors">
                    <img src={act.img} className="w-10 h-10 rounded-lg object-cover" alt="Activity" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {act.action} <span className="text-white font-bold">{act.target}</span>
                      </p>
                      <p className="text-xs text-slate-500">{act.time}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Social & Sharing */}
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Link do Perfil</h4>
              <div className="relative group">
                <input 
                  type="text" 
                  readOnly 
                  value="cardumy.com/viped" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm font-mono text-purple-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button className="absolute right-2 top-2 bottom-2 bg-slate-800 hover:bg-slate-700 px-3 rounded-lg text-slate-300 transition-colors" title="Copiar link">
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-center">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 text-left">QR Code para Trocas</h4>
              <div className="bg-white p-4 inline-block rounded-2xl shadow-xl shadow-white/5 group hover:scale-105 transition-transform duration-500">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=http://cardumy.com/perfil/viped&bgcolor=ffffff&color=0f172a" 
                  className="w-32 h-32 md:w-40 md:h-40" 
                  alt="QR Code" 
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-4 font-medium italic">Scaneie para ver a coleção completa</p>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
             <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Redes Sociais</h4>
             <div className="space-y-3">
               {[
                 { name: 'Instagram', icon: 'fa-instagram', color: 'hover:text-pink-500', handle: '@viped_tcg' },
                 { name: 'Discord', icon: 'fa-discord', color: 'hover:text-indigo-400', handle: 'viped#9999' },
                 { name: 'Twitter', icon: 'fa-x-twitter', color: 'hover:text-white', handle: '@viped' },
               ].map(social => (
                 <div key={social.name} className={`flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 group cursor-pointer ${social.color} transition-colors`}>
                   <div className="flex items-center space-x-3">
                     <i className={`fab ${social.icon} text-lg`}></i>
                     <span className="text-sm font-medium text-slate-400 group-hover:text-inherit">{social.name}</span>
                   </div>
                   <span className="text-xs text-slate-600 font-mono">{social.handle}</span>
                 </div>
               ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
