
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../src/components/AuthProvider';
import { 
  getFullUserProfile, 
  followUser, 
  unfollowUser, 
  submitUserReview 
} from '../src/services/supabaseService';
import { motion, AnimatePresence } from 'motion/react';

export const Profile: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    const idToFetch = userId || currentUser?.username || currentUser?.email;
    if (idToFetch) {
      const data = await getFullUserProfile(idToFetch, currentUser?.id);
      if (data) {
        setProfileData(data);
        setIsFollowing(data.is_following);
      } else if (!userId && currentUser) {
        // Fallback for current user if backend fail
        setProfileData({
          user: {
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            email: currentUser.email,
            id: currentUser.id,
            codename: currentUser.displayName || 'Usuário',
            username: currentUser.displayName?.split(' ')[0].toLowerCase() || 'user',
            bio: 'Usuário do Cardumy'
          },
          stats: { collection_size: 0, wishlist_size: 0, followers: 0, following: 0, approval_rate: null, total_reviews: 0 }
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [userId, currentUser?.id]);

  const handleFollowToggle = async () => {
    if (!currentUser || !profileData?.user?.username) return;
    setFollowLoading(true);
    if (isFollowing) {
      await unfollowUser(profileData.user.username, currentUser.id);
      setIsFollowing(false);
    } else {
      await followUser(profileData.user.username, currentUser.id);
      setIsFollowing(true);
    }
    // Refresh to get updated counts
    const data = await getFullUserProfile(profileData.user.username, currentUser.id);
    if (data) setProfileData(data);
    setFollowLoading(false);
  };

  const handleReviewSubmit = async (isPositive: boolean) => {
    if (!currentUser || !profileData?.user?.username) return;
    setReviewLoading(true);
    const res = await submitUserReview(profileData.user.username, currentUser.id, isPositive, reviewComment);
    if (res) {
      setReviewComment('');
      setShowReviewForm(false);
      // Refresh profile
      fetchProfile();
    }
    setReviewLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profileData || !profileData.user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Usuário não encontrado</h2>
        <p className="text-slate-400 mt-2">O perfil que você está procurando não existe ou foi removido.</p>
      </div>
    );
  }

  const { user: profileUser, stats, reviews } = profileData;
  const isOwnProfile = currentUser?.id === profileUser.id || currentUser?.email === profileUser.email;

  const displayStats = [
    { id: 'colecao', label: 'Coleção', value: stats.collection_size, icon: 'fa-box-archive', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'wishlist', label: 'Wishlist', value: stats.wishlist_size, icon: 'fa-heart', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { id: 'offerlist', label: 'Offerlist', value: stats.offers_size, icon: 'fa-right-left', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  const badges = [
    { name: 'Fundador', icon: 'fa-award', color: 'text-amber-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-12 animate-in fade-in duration-500">
      {/* Hero Section / Cover */}
      <div className="relative mb-32 md:mb-32">
        <div className="h-40 md:h-64 w-full rounded-2xl md:rounded-3xl overflow-hidden relative">
          <img 
            src={profileUser.banner_url || profileUser.cover_url || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200"} 
            className="w-full h-full object-cover" 
            alt="Cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
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
            <p className="text-slate-400 text-xs md:text-sm font-medium mb-2">@{profileUser.username} • {profileUser.role === 'admin' ? 'Administrador' : (profileUser.cardgames?.name || profileUser.favorite_game || 'Colecionador Lendário')}</p>
            
            <div className="flex items-center space-x-4 mb-3">
              <button className="flex items-center space-x-1 group">
                <span className="text-white text-sm font-bold">{stats.following || 0}</span>
                <span className="text-slate-500 text-sm group-hover:underline">Seguindo</span>
              </button>
              <button className="flex items-center space-x-1 group">
                <span className="text-white text-sm font-bold">{stats.followers || 0}</span>
                <span className="text-slate-500 text-sm group-hover:underline">Seguidores</span>
              </button>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 md:gap-2">
              {(() => {
                let tags: string[] = [];
                if (Array.isArray(profileUser.fighter_tags)) {
                  tags = profileUser.fighter_tags;
                } else if (typeof profileUser.fighter_tags === 'string') {
                  tags = profileUser.fighter_tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '');
                }
                return tags.map((tag: string) => (
                  <span key={tag} className="flex items-center space-x-1.5 bg-purple-600/10 border border-purple-500/20 px-2.5 py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    <i className="fas fa-tag"></i>
                    <span>{tag}</span>
                  </span>
                ));
              })()}
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
               <button 
                 onClick={() => navigate('/perfil/editar')}
                 className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg text-xs md:text-sm active:scale-95"
               >
                 Editar Perfil
               </button>
             ) : (
               <button 
                 onClick={handleFollowToggle}
                 disabled={followLoading}
                 className={`flex-1 md:flex-none ${isFollowing ? 'bg-slate-800 text-slate-300' : 'bg-pink-600 text-white'} font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg text-xs md:text-sm active:scale-95 disabled:opacity-50`}
               >
                 {followLoading ? 'Processando...' : isFollowing ? 'Seguindo' : 'Seguir'}
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
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {displayStats.map(stat => (
              <button 
                key={stat.label} 
                onClick={() => {
                  if (['colecao', 'wishlist', 'offerlist'].includes(stat.id)) {
                    navigate(`/pastas/${stat.id}${!isOwnProfile ? `?user=${profileUser.id}` : ''}`);
                  }
                }}
                disabled={!['colecao', 'wishlist', 'offerlist'].includes(stat.id)}
                className={`bg-slate-900/50 backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group ${['colecao', 'wishlist', 'offerlist'].includes(stat.id) ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`${stat.bg} ${stat.color} w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 text-sm md:text-lg group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <p className="text-lg md:text-2xl font-black text-white">{stat.value}</p>
                <p className="text-slate-500 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-left">{stat.label}</p>
              </button>
            ))}
          </div>

          <div className="bg-slate-900/30 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-bold flex items-center space-x-2">
                <i className="fas fa-user-pen text-purple-500 text-sm md:text-base"></i>
                <span>Bio</span>
              </h3>
              {stats.approval_rate !== null && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-black uppercase text-green-400">
                  <i className="fas fa-thumbs-up"></i>
                  <span>{stats.approval_rate}% de Aprovação</span>
                </div>
              )}
            </div>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
              {profileUser.bio || "Este usuário ainda não escreveu uma bio. 🎴"}
            </p>
          </div>

          <div className="bg-slate-900/30 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-bold flex items-center space-x-2">
                <i className="fas fa-star text-yellow-500 text-sm md:text-base"></i>
                <span>Avaliações ({stats.total_reviews})</span>
              </h3>
              {!isOwnProfile && currentUser && (
                <button 
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {showReviewForm ? 'Cancelar' : 'Avaliar Usuário'}
                </button>
              )}
            </div>

            <AnimatePresence>
              {showReviewForm && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-4 mb-6">
                    <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Conte sua experiência com este usuário..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none h-24"
                    />
                    <div className="flex items-center justify-end space-x-3">
                      <button 
                        onClick={() => handleReviewSubmit(false)}
                        disabled={reviewLoading}
                        className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase text-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        <i className="fas fa-thumbs-down"></i>
                        <span>Negativa</span>
                      </button>
                      <button 
                        onClick={() => handleReviewSubmit(true)}
                        disabled={reviewLoading}
                        className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase text-green-500 hover:bg-green-500/20 transition-all disabled:opacity-50"
                      >
                        <i className="fas fa-thumbs-up"></i>
                        <span>Positiva</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {reviews && reviews.length > 0 ? (
                reviews.map((review: any, i: number) => (
                  <div key={i} className="flex items-start space-x-4 py-4 border-b border-slate-800/50 last:border-none">
                    <img 
                      src={review.reviewer?.avatar || `https://ui-avatars.com/api/?name=${review.reviewer?.codename}&background=8b5cf6&color=fff`} 
                      className="w-10 h-10 rounded-full border border-slate-800"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{review.reviewer?.codename}</span>
                        <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${review.is_positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          <i className={`fas ${review.is_positive ? 'fa-thumbs-up' : 'fa-thumbs-down'}`}></i>
                          <span>{review.is_positive ? 'Positiva' : 'Negativa'}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 italic">"{review.comment}"</p>
                      <span className="text-[9px] text-slate-600 mt-2 block font-mono">
                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  Nenhuma avaliação recebida ainda.
                </div>
              )}
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
