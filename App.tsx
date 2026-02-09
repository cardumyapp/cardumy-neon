
import React, { useState, useMemo } from 'react';
import { MemoryRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';
import { DeckBuilderPage } from './pages/DeckBuilder';
import { Stores } from './pages/Stores';
import { Profile } from './pages/Profile';
import { Marketplace } from './pages/Marketplace';
import { Orders } from './pages/Orders';
import { StoreProfile } from './pages/StoreProfile';
import { CartPage } from './pages/Cart';
import { Product, CartItem, GameType } from './types';
import { GAMES } from './constants';

const SidebarItem: React.FC<{ to: string; icon: string; label: string; active: boolean; badge?: number }> = ({ to, icon, label, active, badge }) => (
  <Link 
    to={to} 
    className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${active ? 'bg-purple-600/20 text-purple-400 border-r-4 border-purple-600' : 'hover:bg-slate-800'}`}
  >
    <div className="flex items-center space-x-3">
      <i className={`fas ${icon} w-6 text-center`}></i>
      <span className="font-medium text-sm">{label}</span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className="bg-pink-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
        {badge}
      </span>
    )}
  </Link>
);

const AppContent: React.FC = () => {
  const location = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeGame, setActiveGame] = useState<GameType | 'All'>('All');
  const [isGamePickerOpen, setIsGamePickerOpen] = useState(false);

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const currentGameInfo = useMemo(() => {
    if (activeGame === 'All') return { label: 'Todos os Jogos', icon: 'fa-layer-group', color: 'text-slate-400' };
    const found = GAMES.find(g => g.type === activeGame);
    return { label: activeGame, icon: found?.icon || 'fa-cards', color: 'text-purple-400' };
  }, [activeGame]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-lg shadow-lg shadow-purple-600/20">
            <i className="fas fa-fish-fins text-white text-xl"></i>
          </div>
          <span className="text-xl font-bold tracking-tight">Cardumy</span>
        </div>

        {/* Global Game Selector */}
        <div className="px-4 mb-4">
          <div className="relative">
            <button 
              onClick={() => setIsGamePickerOpen(!isGamePickerOpen)}
              className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center space-x-3">
                <i className={`fas ${currentGameInfo.icon} ${currentGameInfo.color}`}></i>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Foco Global</p>
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">{currentGameInfo.label}</p>
                </div>
              </div>
              <i className={`fas fa-chevron-down text-[10px] text-slate-500 transition-transform ${isGamePickerOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isGamePickerOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-2 max-h-64 overflow-y-auto scrollbar-hide">
                  <button 
                    onClick={() => { setActiveGame('All'); setIsGamePickerOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-colors mb-1 flex items-center space-x-3 ${activeGame === 'All' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                  >
                    <i className="fas fa-layer-group w-5 text-center"></i>
                    <span>Ver Tudo</span>
                  </button>
                  {GAMES.map(game => (
                    <button 
                      key={game.type}
                      onClick={() => { setActiveGame(game.type); setIsGamePickerOpen(false); }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-colors mb-1 flex items-center space-x-3 ${activeGame === game.type ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                      <i className={`fas ${game.icon} w-5 text-center`}></i>
                      <span>{game.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          <SidebarItem to="/" icon="fa-house" label="Início" active={location.pathname === '/'} />
          <SidebarItem to="/perfil" icon="fa-user" label="Perfil" active={location.pathname === '/perfil'} />
          <SidebarItem to="/busca" icon="fa-magnifying-glass" label="Busca de Cartas" active={location.pathname === '/busca'} />
          <SidebarItem to="/marketplace" icon="fa-bag-shopping" label="Marketplace" active={location.pathname === '/marketplace'} />
          <SidebarItem to="/carrinho" icon="fa-shopping-cart" label="Carrinho" active={location.pathname === '/carrinho'} badge={cartCount} />
          <SidebarItem to="/deckbuilder" icon="fa-hammer" label="Deckbuilder" active={location.pathname === '/deckbuilder'} />
          <SidebarItem to="/lojas" icon="fa-shop" label="Lojas" active={location.pathname === '/lojas' || location.pathname.startsWith('/loja/')} />
          <SidebarItem to="/pedidos" icon="fa-clipboard-list" label="Meus Pedidos" active={location.pathname === '/pedidos'} />
          <SidebarItem to="/suporte" icon="fa-headset" label="Suporte" active={location.pathname === '/suporte'} />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center space-x-3 text-slate-400 hover:text-pink-500 cursor-pointer transition-colors group">
            <i className="fab fa-instagram"></i>
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-slate-200">Instagram</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400 hover:text-green-500 cursor-pointer transition-colors group">
            <i className="fab fa-whatsapp"></i>
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-slate-200">WhatsApp</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 z-10">
          <div className="flex items-center space-x-4 bg-slate-800/50 px-4 py-2 rounded-full w-96 border border-white/5">
            <i className="fas fa-search text-slate-500"></i>
            <input 
              type="text" 
              placeholder="Pesquisar carta, produto ou loja..." 
              className="bg-transparent border-none focus:outline-none w-full text-sm"
            />
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/carrinho" className="relative p-2 rounded-xl hover:bg-slate-800 transition-colors">
              <i className="fas fa-shopping-cart text-slate-400"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-slate-900 font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            <button className="relative p-2 rounded-xl hover:bg-slate-800 transition-colors">
              <i className="fas fa-bell text-slate-400"></i>
              <span className="absolute top-1 right-1 w-2 h-2 bg-pink-600 rounded-full border-2 border-slate-900"></span>
            </button>
            <div className="flex items-center space-x-3 bg-slate-800/50 pr-4 pl-1 py-1 rounded-full border border-white/5">
              <img src="https://i.pravatar.cc/150?u=viped" className="w-8 h-8 rounded-full border border-purple-500" alt="Avatar" />
              <div className="flex flex-col">
                 <span className="text-xs font-bold leading-none">viped</span>
                 <span className="text-[10px] text-slate-500 uppercase font-black">Lendário</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-slate-950 to-slate-950 p-8">
          <Routes>
            <Route path="/" element={<Dashboard activeGame={activeGame} />} />
            <Route path="/busca" element={<Search activeGame={activeGame} />} />
            <Route path="/marketplace" element={<Marketplace onAddToCart={addToCart} activeGame={activeGame} />} />
            <Route path="/deckbuilder" element={<DeckBuilderPage activeGame={activeGame} />} />
            <Route path="/lojas" element={<Stores />} />
            <Route path="/loja/:id" element={<StoreProfile onAddToCart={addToCart} />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/pedidos" element={<Orders />} />
            <Route path="/carrinho" element={<CartPage cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
