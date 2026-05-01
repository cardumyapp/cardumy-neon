
import React, { useMemo, useState, useEffect } from 'react';
import { MOCK_UPDATES } from '../constants';
import { GameType } from '../types';
import { Link } from 'react-router-dom';
import { getProducts, getStores, getActivities, getAllTournaments } from '../services/supabaseService';
import { useAuth } from '../components/AuthProvider';
import { OfflineWarning } from '../components/OfflineWarning';
import { fetchLatestPosts, BlogPost } from '../services/blogService';

import { LojistaDashboard } from './LojistaDashboard';

interface DashboardProps {
  activeGame: GameType | 'All';
}

export const Dashboard: React.FC<DashboardProps> = ({ activeGame }) => {
  const { user, login, isOffline } = useAuth();
  const isLojista = user?.role_id === 6;

  if (isLojista) {
      return <LojistaDashboard />;
  }

  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loadingBlog, setLoadingBlog] = useState(true);

  useEffect(() => {
    const unsubProducts = getProducts(setProducts);
    const unsubStores = getStores(setStores);
    
    // Fetch real activities
    getActivities(5).then(setActivities);
    
    // Fetch real tournaments
    getAllTournaments().then(setTournaments);
    
    // Fetch real blog posts from WordPress
    fetchLatestPosts(3).then(posts => {
      setBlogPosts(posts);
      setLoadingBlog(false);
    });

    return () => {
      unsubProducts();
      unsubStores();
    };
  }, []);

  const filteredActions = useMemo(() => {
    if (!activities) return [];
    if (activeGame === 'All') return activities;
    // For now, if activeGame is set, we might not have a direct filter on activity_type 
    // but we can try to find relevant strings in target or action if we wanted.
    // Simplifying to just show latest activities for now as requested.
    return activities;
  }, [activeGame, activities]);

  const upcomingTournaments = useMemo(() => {
    if (!tournaments || !Array.isArray(tournaments)) return [];
    return tournaments
      .filter(t => t && (t.status === 'scheduled' || t.status === 'Aberto'))
      .slice(0, 2)
      .map(t => ({
        id: t.id,
        name: t.name,
        game: t.cardgames?.name || 'TCG',
        date: t.start_date ? new Date(t.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'TBD',
        location: 'Local da Loja',
        imageUrl: t.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400'
      }));
  }, [tournaments]);

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in duration-700 pb-10">
      {isOffline && <OfflineWarning />}
      
      {/* Dynamic Context Banner */}
      {activeGame !== 'All' && (
        <div className="bg-purple-600/10 border border-purple-500/30 px-4 md:px-6 py-4 rounded-2xl md:rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-purple-600/5">
           <div className="flex items-center space-x-4 text-center sm:text-left">
             <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400">
                <i className="fas fa-filter text-sm"></i>
             </div>
             <div>
               <p className="text-sm font-bold text-slate-100">
                 Focado em <span className="text-purple-400 font-black">{activeGame}</span>
               </p>
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Cardume sincronizado</p>
             </div>
           </div>
           <button className="text-[10px] w-full sm:w-auto font-black uppercase text-slate-500 hover:text-white bg-slate-800/50 px-4 py-2 rounded-xl transition-all border border-white/5">Limpar Foco</button>
        </div>
      )}

      {/* Welcome Banner / Hero */}
      <section className="relative overflow-hidden bg-slate-900/40 border border-slate-800 rounded-[32px] md:rounded-[48px] p-6 md:p-12">
        <div className="relative z-10 max-w-2xl space-y-4 md:space-y-6">
          <div className="inline-flex items-center space-x-2 bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full">
            <i className="fas fa-sparkles text-pink-500 text-[10px]"></i>
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">Novo Evento</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
            Seja bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Cardumy</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            A central definitiva para gerenciar coleções e dominar o meta de {activeGame === 'All' ? 'qualquer TCG' : activeGame}.
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
             <Link to="/pastas/colecao" className="bg-purple-600 hover:bg-purple-700 text-white font-black px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 text-sm md:text-base flex items-center justify-center">
               Minha Coleção
             </Link>
             <Link to="/deckbuilder" className="bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-3.5 rounded-2xl transition-all border border-white/5 active:scale-95 text-sm md:text-base flex items-center justify-center">
               Novo Deck
             </Link>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute -top-24 -right-24 w-64 md:w-96 h-64 md:h-96 bg-purple-600/10 rounded-full blur-[100px] md:blur-[120px]"></div>
        <div className="absolute -bottom-24 -left-24 w-48 md:w-64 h-48 md:h-64 bg-pink-600/10 rounded-full blur-[80px] md:blur-[100px]"></div>

        <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 w-48 h-48 items-center justify-center animate-pulse duration-[4000ms]">
          <i className="fas fa-fish-fins text-[120px] text-white/5 rotate-[15deg]"></i>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-3xl rounded-full"></div>
        </div>
      </section>

      {/* FERRAMENTAS SOCIAIS DE ELITE (CardLink e Encontrar Pessoas) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-2">
         {/* Botão CardLink */}
         <Link to="/trocas" className="group relative bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/30 p-6 md:p-8 rounded-[32px] overflow-hidden transition-all hover:border-indigo-400 hover:scale-[1.02] active:scale-95 shadow-2xl text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all"></div>
            <div className="flex items-center space-x-6">
               <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <i className="fas fa-link text-2xl"></i>
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">CardLink</h3>
                  <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-snug">Encontre quem tem a carta que você deseja na coleção.</p>
               </div>
            </div>
            <div className="absolute bottom-6 right-8 text-indigo-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
               <i className="fas fa-arrow-right"></i>
            </div>
         </Link>

         {/* Botão Encontrar Pessoas */}
         <Link to="/comunidade" className="group relative bg-gradient-to-br from-pink-600/20 to-purple-600/10 border border-pink-500/30 p-6 md:p-8 rounded-[32px] overflow-hidden transition-all hover:border-pink-400 hover:scale-[1.02] active:scale-95 shadow-2xl text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-pink-500/20 transition-all"></div>
            <div className="flex items-center space-x-6">
               <div className="w-16 h-16 rounded-2xl bg-pink-600/20 flex items-center justify-center text-pink-400 border border-pink-500/20 group-hover:scale-110 transition-transform">
                  <i className="fas fa-users-viewfinder text-2xl"></i>
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Encontrar Pessoas</h3>
                  <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-snug">Conecte-se e jogue com membros do cardume na sua região.</p>
               </div>
            </div>
            <div className="absolute bottom-6 right-8 text-pink-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
               <i className="fas fa-arrow-right"></i>
            </div>
         </Link>
      </section>

      {/* ESPAÇO PUBLICITÁRIO (Banner de Propaganda) */}
      <section className="px-2">
         <div className="relative h-40 md:h-48 rounded-[32px] md:rounded-[40px] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200" 
              className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-[10000ms]" 
              alt="Publicidade"
            />
            <div className="absolute top-4 right-6 z-20">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] bg-slate-950/50 px-3 py-1 rounded-full border border-white/5">Patrocinado</span>
            </div>
            <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-12 space-y-2">
               <h4 className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Oferta de Lojista</h4>
               <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter max-w-sm leading-tight">Sleeves Dragon Shield com 20% OFF na Loja do Caos</h3>
               <button className="text-[9px] font-black text-white bg-purple-600 px-6 py-2 rounded-xl w-fit uppercase tracking-widest shadow-lg shadow-purple-600/20 group-hover:bg-purple-500 transition-colors">Ver Oferta</button>
            </div>
         </div>
      </section>

      {/* Stats and Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-2">
        <div className="space-y-4 md:space-y-6">
          <h3 className="text-lg md:text-xl font-bold flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
               <i className="fas fa-sparkles text-xs"></i>
            </div>
            <span>Atualizações</span>
          </h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-6 md:space-y-8 shadow-xl">
            {MOCK_UPDATES.map((update, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{update.date}</span>
                  <span className="bg-purple-600/20 text-purple-400 text-[9px] font-black px-3 py-1 rounded-full border border-purple-500/10">v.1.4.2</span>
                </div>
                <ul className="space-y-3">
                  {update.changes.map((change, cIdx) => (
                    <li key={cIdx} className="text-sm flex items-start space-x-3 group">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                      <span className="text-slate-400 leading-relaxed text-xs md:text-sm">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg md:text-xl font-bold flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                 <i className="fas fa-bolt text-xs"></i>
              </div>
              <span>Atividade</span>
            </h3>
            <Link to="/comunidade" className="text-[9px] font-black uppercase text-slate-500 hover:text-white tracking-widest">Ver Feed</Link>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-3 md:p-4 divide-y divide-slate-800/50 shadow-xl">
            {filteredActions && filteredActions.length > 0 ? filteredActions.map((action, idx) => (
              <div key={idx} className="py-4 flex items-center space-x-3 md:space-x-4 px-2">
                <Link to={`/perfil/${action.userId}`} className="relative flex-shrink-0">
                  <img src={action.avatar || `https://i.pravatar.cc/150?u=${action.user}`} className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-700" alt="" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm truncate">
                    <Link to={`/perfil/${action.userId}`} className="font-bold text-white hover:text-purple-400 transition-colors">{action.user}</Link> <span className="text-slate-400">{action.action}</span>
                  </p>
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">{action.timestamp}</p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-500 text-sm italic">Nenhuma ação recente.</div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-1 space-y-4 md:space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg md:text-xl font-bold flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                 <i className="fas fa-trophy text-xs"></i>
              </div>
              <span>Próximos Torneios</span>
            </h3>
            <Link to="/torneios" className="text-[9px] font-black uppercase text-slate-500 hover:text-white tracking-widest">Ver todos</Link>
          </div>
          <div className="space-y-4">
            {upcomingTournaments.map((tourney) => (
              <Link key={tourney.id} to={`/evento/${tourney.id}`} className="block bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="flex items-center p-3 space-x-4">
                  <img src={tourney.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-400 transition-colors">{tourney.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">{tourney.date} • {tourney.location}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Últimas postagens */}
      <section className="space-y-6 px-2">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Últimas postagens</h3>
            <div className="h-1 w-12 bg-purple-600 rounded-full"></div>
          </div>
          <a 
            href="https://cardumy.blog/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-slate-800 hover:bg-slate-700 text-white font-black text-[10px] tracking-widest px-6 py-2.5 rounded-xl border border-white/5 transition-all active:scale-95 uppercase"
          >
            Ver Todos
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingBlog ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-[32px] overflow-hidden h-[400px] animate-pulse">
                <div className="h-48 bg-slate-800"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 w-12 bg-slate-800 rounded"></div>
                  <div className="h-6 w-full bg-slate-800 rounded"></div>
                  <div className="h-6 w-2/3 bg-slate-800 rounded"></div>
                </div>
              </div>
            ))
          ) : blogPosts.length > 0 ? (
            blogPosts.map((post) => {
              const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800';
              const categories = post._embedded?.['wp:term']?.[0] || [];
              const categoryName = categories.length > 0 ? categories[0].name : 'Post';
              const formattedDate = new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

              return (
                <a 
                  key={post.id} 
                  href={post.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group bg-slate-900/40 border border-slate-800 rounded-[32px] overflow-hidden hover:border-purple-500/30 transition-all flex flex-col h-full shadow-lg"
                  id={`blog-post-${post.id}`}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={featuredImage} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      alt={post.title.rendered} 
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-purple-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-lg">
                        {categoryName}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4 flex flex-col flex-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{formattedDate}</span>
                    <h4 
                      className="text-lg font-black text-white leading-tight group-hover:text-purple-400 transition-colors line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                    />
                    <div className="pt-2 mt-auto">
                      <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest flex items-center space-x-2">
                        <span>Ler mais</span>
                        <i className="fas fa-arrow-right text-[8px] group-hover:translate-x-1 transition-transform"></i>
                      </span>
                    </div>
                  </div>
                </a>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 italic border border-dashed border-slate-800 rounded-[32px]">
              Nenhuma postagem encontrada no blog.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
