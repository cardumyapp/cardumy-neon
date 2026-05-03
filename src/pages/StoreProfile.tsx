
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  getStoreBySlug, 
  getProducts, 
  getStoreTournaments, 
  getStoreProfileInfo, 
  getStoreSchedule,
  getStoreHours
} from '../services/supabaseService';
import { ProductType, Product, StoreEvent, Store, GameType } from '../types';
import { useAuth } from '../components/AuthProvider';

interface StoreProfileProps {
  onAddToCart: (product: Product) => void;
}

type TabType = 'home' | 'agenda' | 'events' | 'products';

const DAY_ORDER = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const StoreProfile: React.FC<StoreProfileProps> = ({ onAddToCart }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOffline, user } = useAuth();
  const isLojista = user?.role_id === 6;
  
  const [store, setStore] = useState<Store | null>(null);
  const [storeEvents, setStoreEvents] = useState<StoreEvent[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<{ wishlist_size: number, stock_size: number, offers_size: number, is_open?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      let storeData = null;
      if (id) {
        storeData = await getStoreBySlug(id);
        
        // Fetch stats if possible using slug
        const profileStats = await getStoreProfileInfo(id);
        if (profileStats && 'store' in profileStats) {
          const store = profileStats.store;
          setStats({
            wishlist_size: 0, // Not available directly in profile info anymore
            stock_size: 0,
            offers_size: 0,
            is_open: true
          });
        }
      }

      if (storeData) {
        // Try to parse JSON fields if they are strings
        const tryParse = (val: any) => {
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return val; }
          }
          return val;
        };

        const contato = tryParse(storeData.contato);
        const redesSociais = tryParse(storeData.redes_sociais);

        const getFromList = (list: any, key: string) => {
          if (Array.isArray(list)) {
            const found = list.find(item => (item && typeof item === 'object' && item[key]));
            return found ? found[key] : null;
          }
          if (list && typeof list === 'object') return list[key];
          return null;
        };

        // Combine address fields for a full location string
        const fullLocation = storeData.endereco 
          ? `${storeData.endereco}${storeData.bairro ? `, ${storeData.bairro}` : ''}${storeData.cidade ? ` - ${storeData.cidade}, ${storeData.estado || ''}` : ''}`
          : storeData.location || "Localização não informada";

        // Map database fields to the Store interface
        const mappedStore: Store = {
          ...storeData,
          id: String(storeData.id),
          name: storeData.name,
          logo: storeData.logo,
          location: fullLocation,
          isPartner: !!storeData.parceiro || !!storeData.is_partner || !!storeData.isPartner || storeData.id === 's1' || storeData.id === 's2' || storeData.id === 's3',
          whatsapp: getFromList(contato, 'whatsapp') || storeData.whatsapp || storeData.phone,
          instagram: getFromList(redesSociais, 'instagram') || storeData.instagram,
          discord: getFromList(redesSociais, 'discord') || storeData.discord,
          email: getFromList(contato, 'email') || storeData.email,
          site: storeData.site,
          opening_hours: storeData.opening_hours || storeData.horarios,
          about: storeData.about || storeData.sobre,
          schedule: storeData.schedule || []
        };

        // Fetch real schedule from backend
        const realSchedule = await getStoreSchedule(mappedStore.id);
        if (realSchedule && realSchedule.length > 0) {
          mappedStore.schedule = realSchedule.map((s: any) => ({
            day: s.dia,
            game: (s.game_name || s.jogo) as GameType,
            time: s.horario,
            fee: s.valor_insc ? `R$ ${s.valor_insc}` : 'Gratuito'
          }));
        }

        // Fetch real hours from backend
        const realHours = await getStoreHours(mappedStore.id);
        if (realHours && realHours.length > 0) {
          mappedStore.businessHours = realHours;
        }

        setStore(mappedStore);
        setLoading(false);

        // Fetch real tournaments/events for this store
        const tournamentData = await getStoreTournaments(id || mappedStore.id);
        if (tournamentData && Array.isArray(tournamentData)) {
          const mappedEvents: StoreEvent[] = tournamentData.map((e: any, idx: number) => ({
            id: String(e.id),
            name: e.name,
            date: e.start_date ? new Date(e.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'A combinar',
            game: (e.cardgames?.name || 'TCG') as GameType,
            price: e.price || 0,
            totalSpots: e.max_players || 0,
            filledSpots: 0,
            type: e.status === 'scheduled' ? 'Special' : 'Tournament',
            description: e.description || '',
            imageUrl: e.imageUrl || e.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400',
            isHighlighted: idx === 0 
          }));
          setStoreEvents(mappedEvents);
        }
      } else {
        // Use a generic profile if store not found or no ID provided
        const genericStore: Store = {
          id: 'generic',
          name: 'Cardumy Game Center',
          location: 'Av. Paulista, 1000 - São Paulo, SP',
          logo: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800',
          isPartner: true,
          whatsapp: '11999999999',
          instagram: 'https://instagram.com/cardumy',
          discord: 'https://discord.gg/cardumy',
          site: 'https://cardumy.com',
          email: 'contato@cardumy.com',
          about: 'O Cardumy Game Center é o maior hub de TCG da América Latina. Oferecemos um espaço moderno para jogadores de todos os níveis, com mesas exclusivas, estoque vasto de cartas avulsas e torneios oficiais diários. Nossa missão é fortalecer a comunidade e proporcionar a melhor experiência para colecionadores e duelistas.',
          opening_hours: 'Segunda a Sexta: 10:00 - 22:00\nSábado e Domingo: 09:00 - 20:00',
          schedule: [
            { day: 'Segunda', game: 'Magic', time: '19:00', fee: 'Gratuito' },
            { day: 'Terça', game: 'Pokémon', time: '18:30', fee: 'R$ 20,00' },
            { day: 'Quarta', game: 'One Piece', time: '19:00', fee: 'R$ 25,00' },
            { day: 'Quinta', game: 'Yu-Gi-Oh!', time: '18:00', fee: 'R$ 15,00' },
            { day: 'Sexta', game: 'Magic', time: '19:30', fee: 'R$ 80,00' },
            { day: 'Sábado', game: 'Pokémon', time: '10:00', fee: 'R$ 50,00' }
          ]
        };
        setStore(genericStore);

        // Mock events for generic store
        const mockEvents: StoreEvent[] = [
          {
            id: 'ev-1',
            name: 'Campeonato Regional One Piece',
            description: 'O maior torneio do mês com premiação em boxes exclusivas e cartas promocionais raras.',
            date: '25 Mai, 10:00',
            game: 'One Piece',
            price: 50,
            imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=600',
            totalSpots: 64,
            filledSpots: 42,
            isHighlighted: true,
            type: 'Tournament'
          },
          {
            id: 'ev-2',
            name: 'Pauper Night (Magic)',
            description: 'Venha testar seus decks comuns em um ambiente competitivo e amigável.',
            date: 'Quarta-feira, 19:00',
            game: 'Magic',
            price: 15,
            imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400',
            totalSpots: 32,
            filledSpots: 18,
            type: 'Special'
          }
        ];
        setStoreEvents(mockEvents);
      }

      getProducts((data) => {
        let finalProducts = data;
        
        // If it's the generic store, add or ensure there are demo products
        if (!storeData) {
          const hasGenericProducts = data.some(p => p.storeId === 'generic');
          if (!hasGenericProducts) {
             const demoProducts = [
               {
                 id: 'p-demo-1',
                 name: 'Booster Box One Piece: Pillars of Strength',
                 type: ProductType.BOOSTER,
                 price: 549.90,
                 imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=300',
                 storeId: 'generic',
                 storeName: 'Cardumy Game Center',
                 game: 'One Piece'
               },
               {
                 id: 'p-demo-2',
                 name: 'Starter Deck Pokémon: Zapdos ex',
                 type: ProductType.STARTER_DECK,
                 price: 89.90,
                 imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=300',
                 storeId: 'generic',
                 storeName: 'Cardumy Game Center',
                 game: 'Pokémon'
               },
               {
                 id: 'p-demo-3',
                 name: 'Dragon Shield Sleeves: Matte Purple',
                 type: ProductType.ACCESSORY,
                 price: 75.00,
                 imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=300',
                 storeId: 'generic',
                 storeName: 'Cardumy Game Center',
                 game: 'One Piece'
               }
             ];
             finalProducts = [...data, ...demoProducts];
          }
        }
        
        setAllProducts(finalProducts);
        setLoading(false);
      });
    };

    fetchData();
  }, [id]);

  const mappedStoreProducts = useMemo(() => {
    if (!store) return [];
    return allProducts
      .filter(p => {
        const stockItems = Array.isArray(p.store_stock) ? p.store_stock : [];
        return stockItems.some((si: any) => (String(si.stores?.id) === String(store.id) || si.stores?.slug === store.slug) && si.quantity > 0);
      })
      .map(p => {
        const stockEntry = p.store_stock.find((si: any) => (String(si.stores?.id) === String(store.id) || si.stores?.slug === store.slug) && si.quantity > 0);
        return {
          ...p,
          id: p.id,
          imageUrl: p.image_url || p.imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400',
          name: p.beauty_name || p.name,
          price: stockEntry?.store_price || p.msrp || 0,
          stock: stockEntry?.quantity || 0,
          storeId: store.id,
          storeName: store.name,
          isOfficialPartner: store.isPartner,
          game: p.cardgames?.name || (Array.isArray(p.cardgames) ? p.cardgames[0]?.name : 'TCG'),
          type: p.product_types?.name || (Array.isArray(p.product_types) ? p.product_types[0]?.name : 'Produto')
        };
      });
  }, [allProducts, store]);

  const totalPages = Math.ceil(mappedStoreProducts.length / itemsPerPage);
  
  const paginatedStoreProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return mappedStoreProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [mappedStoreProducts, currentPage]);

  const sortedSchedule = useMemo(() => {
    if (!store || !store.schedule) return [];
    return [...store.schedule]
      .sort((a, b) => {
        return DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
      });
  }, [store]);

  const highlightedEvent = useMemo(() => {
    return storeEvents.find(e => e.isHighlighted) || storeEvents[0];
  }, [storeEvents]);

  const handleBuyTicket = (ev: StoreEvent) => {
    if (!store) return;
    const ticketProduct: Product = {
      id: ev.id,
      slug: ev.id,
      name: `Ingresso: ${ev.name}`,
      type: ProductType.TICKET,
      price: ev.price || 0,
      imageUrl: ev.imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=300',
      storeName: store.name,
      storeId: store.id,
      isOfficialPartner: store.isPartner,
      game: ev.game,
      stock: ev.totalSpots - ev.filledSpots
    };
    onAddToCart(ticketProduct);
    navigate('/carrinho');
  };

  const shareStore = () => {
    if (navigator.share) {
      navigator.share({
        title: store?.name,
        text: `Confira a loja ${store?.name} no Cardumy!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <i className="fas fa-store-slash text-6xl text-slate-800"></i>
        <h2 className="text-2xl font-bold text-slate-500">Loja não encontrada</h2>
        <Link to="/lojas" className="text-purple-400 hover:underline">Voltar para lista de lojas</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20 md:pb-8">
      {/* Top Nav Buttons */}
      <div className="flex items-center justify-between">
        <Link to="/lojas" className="bg-slate-900/50 hover:bg-slate-800 text-slate-400 px-3 md:px-4 py-2 rounded-xl border border-slate-800 text-[10px] md:text-xs font-bold transition-all flex items-center space-x-2">
          <i className="fas fa-arrow-left"></i>
          <span>Explorar Lojas</span>
        </Link>
        <div className="flex space-x-2">
          <button className="w-9 h-9 md:w-10 md:h-10 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500 hover:text-pink-500 transition-colors">
            <i className="fas fa-heart text-sm md:text-base"></i>
          </button>
          <button onClick={shareStore} className="w-9 h-9 md:w-10 md:h-10 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500 hover:text-purple-400 transition-colors">
            <i className="fas fa-share-nodes text-sm md:text-base"></i>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="relative rounded-2xl md:rounded-[40px] overflow-hidden border border-slate-800 shadow-2xl h-[300px] md:h-[450px]">
        <img 
          src={store.logo || "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=1200"} 
          className="w-full h-full object-cover brightness-[0.4]" 
          alt="Store Banner" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        
        {/* Banner Overlay Info */}
        <div className="absolute bottom-4 md:bottom-10 left-4 md:left-10 right-4 md:right-10 flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-8">
          <div className="relative hidden md:block">
             <img 
               src={store.logo || `https://ui-avatars.com/api/?name=${store.name}`} 
               className="relative w-32 h-32 md:w-44 md:h-44 rounded-[28px] md:rounded-[32px] border-4 border-slate-950 object-cover bg-slate-900 shadow-2xl" 
               alt={store.name} 
             />
          </div>
          <div className="flex-1 space-y-3 md:space-y-4 pb-2">
             <div className="flex items-center space-x-3 md:space-x-4">
                <h1 className="text-2xl md:text-6xl font-black tracking-tight text-white">{store.name}</h1>
                {store.isPartner && (
                  <div className="group relative">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-950 text-[8px] md:text-[10px] font-black px-3 md:px-4 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center">
                      <i className="fas fa-crown mr-1 md:mr-2"></i>
                      Parceiro Cardumy
                    </span>
                  </div>
                )}
             </div>
             
             <div className="space-y-3 md:space-y-4">
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <div className="flex items-center space-x-2 text-white/90 text-xs md:text-sm font-bold">
                   <i className="fas fa-location-dot text-purple-400"></i>
                   <span>{store.location}</span>
                </div>
                
                {stats && stats.is_open !== undefined && (
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-[10px] md:text-xs font-black uppercase tracking-widest ${
                    stats.is_open 
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${stats.is_open ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                    <span>{stats.is_open ? 'Aberto Agora' : 'Fechado'}</span>
                  </div>
                )}
              </div>

               <div className="flex flex-wrap gap-2 md:gap-3">
                  {stats && (
                    <>
                       <div className="flex items-center space-x-3 bg-slate-950/60 backdrop-blur-md px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-white/5">
                         <span className="text-sm md:text-lg font-black text-white">{stats.wishlist_size}</span>
                         <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">Wish</span>
                       </div>
                       <div className="flex items-center space-x-3 bg-slate-950/60 backdrop-blur-md px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-white/5">
                         <span className="text-sm md:text-lg font-black text-white">{stats.stock_size}</span>
                         <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">Estoque</span>
                       </div>
                    </>
                  )}
                  <div className="flex items-center space-x-2 md:space-x-3 bg-slate-950/60 backdrop-blur-md px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-white/5">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">Pagamento:</span>
                    <div className="flex items-center space-x-2 md:space-x-4">
                      <span className="flex items-center text-[9px] md:text-[11px] text-slate-200 font-bold"><i className="fas fa-handshake text-purple-400 mr-1.5 md:mr-2"></i>MP</span>
                      <span className="flex items-center text-[9px] md:text-[11px] text-slate-200 font-bold"><i className="fas fa-qrcode text-purple-400 mr-1.5 md:mr-2"></i>Pix</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 md:space-x-3 bg-slate-950/60 backdrop-blur-md px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-white/5">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">Logística:</span>
                    <div className="flex items-center space-x-2 md:space-x-4">
                      <span className="flex items-center text-[9px] md:text-[11px] text-emerald-400 font-bold"><i className="fas fa-store mr-1.5 md:mr-2"></i>Retirada</span>
                      <span className="flex items-center text-[9px] md:text-[11px] text-slate-200 font-bold"><i className="fas fa-truck-fast text-slate-400 mr-1.5 md:mr-2"></i>Frete</span>
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-8 space-y-8 md:space-y-12">
          
          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 bg-slate-900/30 p-1 rounded-xl md:rounded-2xl border border-slate-800/50 overflow-x-auto scrollbar-hide">
            {(['home', 'agenda', 'events', 'products'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[100px] py-2 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'home' ? 'Destaques' : 
                 tab === 'agenda' ? 'Agenda Semanal' : 
                 tab === 'events' ? 'Eventos' : 
                 'Produtos'}
              </button>
            ))}
          </div>

          {activeTab === 'home' && (
            <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
              {/* Highlights Section */}
              <section className="space-y-4 md:space-y-6">
                <div className="relative overflow-hidden bg-slate-900/40 border border-slate-800 rounded-[32px] p-8 md:p-10">
                  <div className="relative z-10 space-y-4">
                     <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Sobre a Loja</h3>
                     <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                        {store.about || 'Esta loja ainda não preencheu suas informações.'}
                     </p>
                  </div>
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/5 rounded-full blur-[100px]"></div>
                </div>

                {highlightedEvent && (
                  <section className="relative rounded-2xl md:rounded-[32px] overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-purple-500/20 p-6 md:p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        <img 
                          src={highlightedEvent.imageUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=300"} 
                          className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-2xl shadow-xl border border-white/5" 
                          alt="Promo"
                        />
                        <div className="flex-1 space-y-3 md:space-y-4">
                           <div className="inline-flex items-center space-x-2 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-purple-400">Destaque do Mês</span>
                           </div>
                           <h3 className="text-2xl md:text-3xl font-black text-white">{highlightedEvent.name}</h3>
                           <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                              {highlightedEvent.description}
                           </p>
                           <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                             {!isLojista && (
                               <button 
                                 onClick={() => handleBuyTicket(highlightedEvent)}
                                 className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black px-10 py-3.5 rounded-xl shadow-lg active:scale-95 text-sm"
                               >
                                 Participar agora
                               </button>
                             )}
                           </div>
                        </div>
                    </div>
                  </section>
                )}
              </section>
            </div>
          )}

          {activeTab === 'agenda' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 animate-in fade-in duration-500">
               {/* Business Hours */}
               <div className="space-y-6">
                 <h3 className="text-lg md:text-xl font-black text-white flex items-center">
                    <span className="w-1 h-5 md:w-1.5 md:h-6 bg-emerald-600 rounded-full mr-3"></span>
                    Horário de Funcionamento
                 </h3>
                 <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
                    {store.businessHours && store.businessHours.length > 0 ? (
                      DAY_ORDER.map((day, idx) => {
                        const hoursForDay = store.businessHours?.filter(h => h.day_of_week === idx);
                        const isClosed = !hoursForDay || hoursForDay.length === 0 || hoursForDay.every(h => h.is_closed);
                        
                        return (
                          <div key={idx} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                            <span className={`text-xs md:text-sm font-bold ${idx === new Date().getDay() ? 'text-purple-400' : 'text-slate-400'}`}>
                              {day}
                            </span>
                            <div className="text-right">
                              {isClosed ? (
                                <span className="text-xs md:text-sm font-black text-rose-500/80 uppercase">Fechado</span>
                              ) : (
                                <div className="space-y-1">
                                  {hoursForDay?.map((h, hidx) => (
                                    <p key={hidx} className="text-xs md:text-sm font-black text-white">
                                      {h.open_time.substring(0, 5)} - {h.close_time.substring(0, 5)}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-slate-500 text-sm italic py-4">Horário de funcionamento não informado.</p>
                    )}
                 </div>
               </div>

               {/* Weekly Events */}
               <div className="space-y-6">
                 <h3 className="text-lg md:text-xl font-black text-white flex items-center">
                    <span className="w-1 h-5 md:w-1.5 md:h-6 bg-purple-600 rounded-full mr-3"></span>
                    Torneios Semanais
                 </h3>
                 
                 <div className="space-y-4">
                    {sortedSchedule.length > 0 ? sortedSchedule.map((t, i) => (
                      <div key={i} className="bg-slate-900/50 border border-slate-800 p-5 md:p-6 rounded-2xl flex items-center justify-between group hover:border-purple-500/30 transition-all">
                         <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-[10px] uppercase tracking-tighter ${
                              t.day === 'Domingo' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {t.day.substring(0, 3)}
                            </div>
                            <div>
                               <h4 className="text-sm font-bold text-white uppercase">{t.game}</h4>
                               <p className="text-[10px] text-slate-500 mt-1 flex items-center">
                                  <i className="far fa-clock mr-1.5"></i>
                                  {t.time}
                               </p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-xs font-black text-emerald-400">{t.fee || 'Gratuito'}</p>
                         </div>
                      </div>
                    )) : (
                      <div className="py-12 border border-dashed border-slate-800 rounded-3xl text-center text-slate-500 text-sm italic">
                        Sem torneios fixos na agenda no momento.
                      </div>
                    )}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'events' && (
             <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {storeEvents.length ? storeEvents.map((ev, i) => (
                      <Link key={i} to={`/evento/${ev.id}`} className="group relative bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all">
                         <div className="h-40 relative">
                            <img src={ev.imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={ev.name} />
                            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                               <span className="text-[9px] font-black text-white uppercase tracking-widest">{ev.date}</span>
                            </div>
                         </div>
                         <div className="p-6 space-y-3">
                            <h4 className="font-black text-white uppercase tracking-tight">{ev.name}</h4>
                            <div className="flex items-center justify-between">
                               <span className="text-xs font-bold text-purple-400">{ev.game}</span>
                               <span className="text-sm font-black text-white">R$ {ev.price}</span>
                            </div>
                         </div>
                      </Link>
                   )) : (
                      <div className="col-span-full py-12 text-center text-slate-500 text-sm italic">Nenhum evento futuro cadastrado.</div>
                   )}
                </div>
             </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {paginatedStoreProducts.length > 0 ? paginatedStoreProducts.map((p, i) => (
                     <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col group hover:border-purple-500/50 transition-all">
                       <div className="aspect-square p-4 bg-slate-950/20 relative">
                         <img src={p.imageUrl} className="w-full h-full object-contain rounded-xl group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                       </div>
                       <div className="p-4 space-y-3">
                         <div>
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{p.type}</p>
                           <h4 className="font-bold text-white text-xs line-clamp-2 h-8">{p.name}</h4>
                         </div>
                         <div className="flex justify-between items-center pt-2">
                           <p className="text-sm font-black text-white">R$ {p.price}</p>
                           {!isLojista && (
                             <button 
                               onClick={() => onAddToCart(p)}
                               className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center transition-all active:scale-90"
                             >
                               <i className="fas fa-plus text-xs"></i>
                             </button>
                           )}
                         </div>
                       </div>
                     </div>
                   )) : (
                    <div className="col-span-full py-12 text-center text-slate-500 text-sm italic">Esta loja ainda não possui produtos no marketplace.</div>
                   )}
               </div>

               {/* Paginação */}
               {totalPages > 1 && (
                 <div className="flex items-center justify-center space-x-2 pt-8">
                   <button
                     disabled={currentPage === 1}
                     onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                     className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:border-purple-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                     <i className="fas fa-chevron-left text-xs"></i>
                   </button>
                   
                   <div className="flex items-center space-x-1">
                     {Array.from({ length: totalPages }, (_, i) => i + 1)
                       .filter(page => {
                         return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                       })
                       .map((page, index, array) => {
                         const isFirst = index === 0;
                         const prevPage = array[index - 1];
                         const showEllipsis = !isFirst && page - prevPage > 1;
 
                         return (
                           <React.Fragment key={page}>
                             {showEllipsis && <span className="text-slate-600 px-1">...</span>}
                             <button
                               onClick={() => setCurrentPage(page)}
                               className={`w-10 h-10 rounded-xl border font-bold text-xs transition-all ${
                                 currentPage === page 
                                   ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                                   : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                               }`}
                             >
                               {page}
                             </button>
                           </React.Fragment>
                         );
                       })}
                   </div>
 
                   <button
                     disabled={currentPage === totalPages}
                     onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                     className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:border-purple-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                     <i className="fas fa-chevron-right text-xs"></i>
                   </button>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
           {/* Horários e Localização */}
           <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 points-30 to-pink-600"></div>
              
              <div className="space-y-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center">
                  <i className="fas fa-clock mr-3 text-purple-500"></i>
                  Horários
                </h3>
                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50">
                  {store.businessHours && store.businessHours.length > 0 ? (
                    <div className="space-y-2">
                       {DAY_ORDER.map((day, idx) => {
                         const hoursForDay = store.businessHours?.filter(h => h.day_of_week === idx);
                         const isClosed = !hoursForDay || hoursForDay.length === 0 || hoursForDay.every(h => h.is_closed);
                         if (isClosed) return null; // Show only open days in this compact view
                         return (
                           <div key={idx} className="flex justify-between items-center text-[11px]">
                             <span className="text-slate-500 font-bold">{day}</span>
                             <div className="text-right">
                               {hoursForDay?.map((h, hidx) => (
                                 <p key={hidx} className="text-white font-black">
                                   {h.open_time.substring(0, 5)} - {h.close_time.substring(0, 5)}
                                 </p>
                               ))}
                             </div>
                           </div>
                         );
                       })}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                      {store.opening_hours || 'Horário de funcionamento não informado.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t border-slate-800/50">
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center">
                  <i className="fas fa-link mr-3 text-purple-500"></i>
                  Redes Sociais
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {store.whatsapp && (
                    <a href={`https://wa.me/${store.whatsapp}`} target="_blank" className="flex items-center space-x-3 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl hover:bg-emerald-500/20 transition-all text-emerald-400">
                      <i className="fab fa-whatsapp text-lg"></i>
                      <span className="text-[10px] font-black uppercase">Whats</span>
                    </a>
                  )}
                  {store.instagram && (
                    <a href={store.instagram} target="_blank" className="flex items-center space-x-3 bg-pink-500/10 border border-pink-500/20 p-3 rounded-xl hover:bg-pink-500/20 transition-all text-pink-400">
                      <i className="fab fa-instagram text-lg"></i>
                      <span className="text-[10px] font-black uppercase">Insta</span>
                    </a>
                  )}
                  {store.discord && (
                    <a href={store.discord} target="_blank" className="flex items-center space-x-3 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl hover:bg-indigo-500/20 transition-all text-indigo-400">
                      <i className="fab fa-discord text-lg"></i>
                      <span className="text-[10px] font-black uppercase">Discord</span>
                    </a>
                  )}
                  {store.site && (
                    <a href={store.site} target="_blank" className="flex items-center space-x-3 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl hover:bg-blue-500/20 transition-all text-blue-400">
                      <i className="fas fa-globe text-lg"></i>
                      <span className="text-[10px] font-black uppercase">Site</span>
                    </a>
                  )}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
