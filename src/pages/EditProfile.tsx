
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { getUserProfile, updateUserProfile, getFighterTags } from '../services/supabaseService';
import { PREDEFINED_AVATARS, PREDEFINED_COVERS, UserProfile } from '../types';
import { motion } from 'motion/react';

export const EditProfile: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [dbGames, setDbGames] = useState<{id: any, name: string}[]>([]);
  const [allFighterTags, setAllFighterTags] = useState<{id: any, name: string}[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    codename: '',
    bio: '',
    phone: '',
    birth_date: '',
    gender: '',
    favorite_cardgame_id: '',
    avatar: '',
    banner_url: '',
    fighter_tags: [] as string[]
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      const { getCardgames } = await import('../services/supabaseService');
      const [games, tags] = await Promise.all([
        getCardgames(),
        getFighterTags()
      ]);
      setDbGames(games);
      setAllFighterTags(tags);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        setLoading(true);
        const profile = await getUserProfile(currentUser.email);
        if (profile) {
          let tags: string[] = [];
          if (Array.isArray(profile.fighter_tags)) {
            tags = profile.fighter_tags;
          } else if (typeof profile.fighter_tags === 'string') {
            tags = profile.fighter_tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '');
          }

          let birthDate = profile.birth_date || '';
          if (birthDate && birthDate.includes('T')) {
            birthDate = birthDate.split('T')[0];
          }

          setFormData({
            username: profile.username || '',
            codename: profile.codename || '',
            bio: profile.bio || '',
            phone: profile.phone || '',
            birth_date: birthDate,
            gender: profile.gender || '',
            favorite_cardgame_id: profile.favorite_cardgame_id || '',
            avatar: profile.avatar || profile.photoURL || PREDEFINED_AVATARS[0],
            banner_url: profile.banner_url || profile.cover_url || PREDEFINED_COVERS[0],
            fighter_tags: tags
          });
        }
        setLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => {
      if (prev.fighter_tags.includes(tag)) {
        return { ...prev, fighter_tags: prev.fighter_tags.filter(t => t !== tag) };
      }
      return { ...prev, fighter_tags: [...prev.fighter_tags, tag] };
    });
  };

  const handleAvatarSelect = (avatar: string) => {
    setFormData(prev => ({ ...prev, avatar }));
  };

  const handleCoverSelect = (banner_url: string) => {
    setFormData(prev => ({ ...prev, banner_url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setMessage(null);

    try {
      const result = await updateUserProfile(currentUser.id || currentUser.email, formData);
      if (result) {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage({ type: 'error', text: 'Falha ao atualizar perfil. Tente novamente.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao conectar ao servidor.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 md:px-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Editar Perfil</h1>
          <p className="text-slate-400 text-sm">Personalize sua identidade no ecossistema Cardumy</p>
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar Selection */}
        <section className="bg-slate-900/30 border border-slate-800 p-6 md:p-8 rounded-[32px] space-y-6">
          <h3 className="text-lg font-bold flex items-center space-x-2">
            <i className="fas fa-image text-purple-500"></i>
            <span>Avatar</span>
          </h3>
          <div className="flex flex-wrap gap-4">
            {PREDEFINED_AVATARS.map((avatar, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAvatarSelect(avatar)}
                className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 transition-all ${formData.avatar === avatar ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/20' : 'border-slate-800 hover:border-slate-700'}`}
              >
                <img src={avatar} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                {formData.avatar === avatar && (
                  <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                    <i className="fas fa-check text-white shadow-sm"></i>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Cover Selection */}
        <section className="bg-slate-900/30 border border-slate-800 p-6 md:p-8 rounded-[32px] space-y-6">
          <h3 className="text-lg font-bold flex items-center space-x-2">
            <i className="fas fa-panorama text-purple-500"></i>
            <span>Capa do Perfil</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PREDEFINED_COVERS.map((cover, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleCoverSelect(cover)}
                className={`relative h-24 md:h-32 rounded-2xl overflow-hidden border-4 transition-all ${formData.banner_url === cover ? 'border-purple-500 scale-105 shadow-lg shadow-purple-500/20' : 'border-slate-800 hover:border-slate-700'}`}
              >
                <img src={cover} alt={`Capa ${i}`} className="w-full h-full object-cover" />
                {formData.banner_url === cover && (
                  <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                    <i className="fas fa-check text-white shadow-sm"></i>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Basic Info */}
        <section className="bg-slate-900/30 border border-slate-800 p-6 md:p-8 rounded-[32px] space-y-6">
          <h3 className="text-lg font-bold flex items-center space-x-2">
            <i className="fas fa-user text-purple-500"></i>
            <span>Informações Básicas</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500 text-sm">@</span>
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                  placeholder="seu_username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Codename (Nome de Exibição)</label>
              <input 
                type="text" 
                name="codename"
                value={formData.codename}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                placeholder="Ex: Mestre Pokémon"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bio / Sobre Você</label>
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors resize-none"
                placeholder="Conte um pouco sobre sua jornada no mundo do TCG..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data de Nascimento</label>
              <input 
                type="date" 
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors color-scheme-dark"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp / Telefone</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gênero</label>
              <select 
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors appearance-none"
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Não-binário">Não-binário</option>
                <option value="Outro">Outro</option>
                <option value="Prefiro não dizer">Prefiro não dizer</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Jogo Favorito</label>
              <select 
                name="favorite_cardgame_id"
                value={formData.favorite_cardgame_id}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors appearance-none"
              >
                <option value="">Selecione um jogo</option>
                {dbGames.map(game => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Fighter Tags */}
        <section className="bg-slate-900/30 border border-slate-800 p-6 md:p-8 rounded-[32px] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center space-x-2">
              <i className="fas fa-tags text-purple-500"></i>
              <span>Fighter Tags</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{formData.fighter_tags.length} selecionadas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allFighterTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.name)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${formData.fighter_tags.includes(tag.name) ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                {tag.name}
              </button>
            ))}
            {allFighterTags.length === 0 && (
              <p className="text-[10px] text-slate-600 italic">Carregando tags...</p>
            )}
          </div>
        </section>

        <div className="flex items-center space-x-4 pt-4 pb-12">
          <button 
            type="submit"
            disabled={saving}
            className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-xl shadow-purple-600/20 active:scale-95 text-sm uppercase tracking-widest"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button 
            type="button"
            onClick={() => navigate('/profile')}
            className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white font-black px-12 py-4 rounded-2xl transition-all active:scale-95 text-sm uppercase tracking-widest border border-slate-700"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
