import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  active: boolean;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, active, collapsed }) => (
  <Link
    to={to}
    className={`flex items-center group relative px-4 py-3 rounded-lg transition-all duration-300 ${
      active 
        ? 'bg-purple-600/20 text-purple-400 border-r-4 border-purple-600' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
    title={collapsed ? label : ''}
  >
    <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'space-x-3'}`}>
      <i className={`fas ${icon} w-6 text-center text-lg ${active ? 'text-purple-400' : 'group-hover:text-purple-400'}`}></i>
      {!collapsed && <span className="font-medium text-sm transition-opacity duration-300 opacity-100">{label}</span>}
    </div>
  </Link>
);

const SidebarGroup: React.FC<{ label: string; collapsed: boolean; children: React.ReactNode }> = ({ label, collapsed, children }) => (
  <div className="mb-4">
    {!collapsed && (
      <p className="px-4 text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 mt-4 flex items-center">
        <span className="mr-2">{label}</span>
        <span className="flex-1 h-[1px] bg-slate-800/50"></span>
      </p>
    )}
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

interface SidebarProps {
  collapsed: boolean;
  onMobileClose?: () => void;
  activeGame: string;
  setActiveGame: (game: any) => void;
  dbGames: any[];
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onMobileClose, activeGame, setActiveGame, dbGames }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isLojista = user?.role_id === 6 || user?.role_id === 1;
  const [isGamePickerOpen, setIsGamePickerOpen] = useState(false);

  const currentGameInfo = useMemo(() => {
    if (activeGame === 'All') return { label: 'Todos os Jogos' };
    const dbGame = dbGames.find(g => g.slug === activeGame || g.name === activeGame);
    return { label: dbGame ? dbGame.name : activeGame };
  }, [activeGame, dbGames]);

  // Lojista Specific Items
  const lojistaGeral = [
    { to: '/', icon: 'fa-chart-pie', label: 'Dashboard', active: location.pathname === '/' },
    { to: '/minha-loja/agenda', icon: 'fa-calendar-days', label: 'Agenda Semanal', active: location.pathname === '/minha-loja/agenda' },
    { to: '/minha-loja/horarios', icon: 'fa-clock', label: 'Horários', active: location.pathname === '/minha-loja/horarios' },
  ];

  const lojistaStore = [
    { to: '/minha-loja', icon: 'fa-store', label: 'Configurações', active: location.pathname === '/minha-loja' && !location.pathname.includes('agenda') && !location.pathname.includes('horarios') },
    { to: '/gerenciar-estoque', icon: 'fa-boxes-stacked', label: 'Estoque', active: location.pathname === '/gerenciar-estoque' },
    { to: '/pedidos-recebidos', icon: 'fa-clipboard-check', label: 'Pedidos', active: location.pathname === '/pedidos-recebidos' },
  ];

  const lojistaExtra = [
    { to: '/meus-torneios', icon: 'fa-trophy', label: 'Meus Torneios', active: location.pathname === '/meus-torneios' || location.pathname === '/novo-torneio' },
    { to: '/produtos', icon: 'fa-bag-shopping', label: 'Meus Produtos', active: location.pathname === '/produtos' },
  ];

  // Common items for members (used if !isLojista)
  const commonTopItems = [
    { to: '/', icon: 'fa-house', label: 'Início', active: location.pathname === '/' },
    { to: '/lojas', icon: 'fa-store', label: 'Lojas', active: location.pathname === '/lojas' },
    { to: '/torneios', icon: 'fa-trophy', label: 'Torneios', active: location.pathname === '/torneios' || location.pathname.includes('/evento/') },
    { to: '/produtos', icon: 'fa-bag-shopping', label: 'Produtos', active: location.pathname === '/produtos' },
  ];

  const memberItems = [
    { to: '/comunidade', icon: 'fa-users', label: 'Social', active: location.pathname === '/comunidade' },
    { to: '/pastas', icon: 'fa-folder', label: 'Minhas Cartas', active: location.pathname === '/pastas' },
    { to: '/deckbuilder', icon: 'fa-layer-group', label: 'Meus Decks', active: location.pathname === '/deckbuilder' },
    { to: '/pedidos', icon: 'fa-clipboard-list', label: 'Meus Pedidos', active: location.pathname === '/pedidos' },
    { to: '/perfil', icon: 'fa-user-circle', label: 'Meu Perfil', active: location.pathname === '/perfil' },
  ];

  return (
    <div className="flex flex-col h-full py-4">
      <div className={`p-6 mb-2 flex items-center ${collapsed ? 'justify-center w-full' : 'justify-between'}`}>
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-lg shadow-lg shadow-purple-600/20">
            <i className="fas fa-fish-fins text-white text-xl"></i>
          </div>
          {!collapsed && <span className="text-xl font-bold tracking-tight text-white transition-opacity duration-300">Cardumy</span>}
        </div>
        
        {onMobileClose && (
          <button onClick={onMobileClose} className="md:hidden text-slate-500 hover:text-white p-2">
            <i className="fas fa-xmark text-lg"></i>
          </button>
        )}
      </div>

      {/* Global Game Selector */}
      <div className={`px-4 mb-4 transition-all duration-300 ${collapsed ? 'md:h-0 md:opacity-0 md:overflow-hidden md:mb-0' : 'opacity-100'}`}>
        <div className="relative">
          <button 
            onClick={() => setIsGamePickerOpen(!isGamePickerOpen)}
            className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Foco Global</p>
                <p className="text-xs font-bold text-white truncate max-w-[120px]">{currentGameInfo.label}</p>
              </div>
            </div>
            <i className="fas fa-chevron-down text-[10px] text-slate-500"></i>
          </button>

          {isGamePickerOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-2 max-h-64 overflow-y-auto scrollbar-hide">
                <button 
                  onClick={() => { setActiveGame('All'); setIsGamePickerOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-colors mb-1 flex items-center ${activeGame === 'All' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                >
                  <span>Ver Tudo</span>
                </button>
                {dbGames.map((game, idx) => (
                  <button 
                    key={game.id || `game-nav-${idx}`}
                    onClick={() => { setActiveGame(game.slug || game.name); setIsGamePickerOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-colors mb-1 flex items-center ${activeGame === (game.slug || game.name) ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                  >
                    <span>{game.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto no-scrollbar">
        {isLojista ? (
          <>
            <SidebarGroup label="Geral" collapsed={collapsed}>
              {lojistaGeral.map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
            </SidebarGroup>

            <SidebarGroup label="Gerenciamento" collapsed={collapsed}>
              {lojistaStore.map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
            </SidebarGroup>

            <SidebarGroup label="Atividades" collapsed={collapsed}>
              {lojistaExtra.map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
            </SidebarGroup>
          </>
        ) : (
          <>
            <SidebarGroup label="Navegação" collapsed={collapsed}>
              {commonTopItems.map((item) => (
                <NavItem key={item.to} {...item} collapsed={collapsed} />
              ))}
            </SidebarGroup>
            
            <SidebarGroup label="Membro" collapsed={collapsed}>
              {memberItems.map((item) => (
                <NavItem key={item.to} {...item} collapsed={collapsed} />
              ))}
            </SidebarGroup>
          </>
        )}

        <div className="mt-4 pt-4 border-t border-slate-800/50">
          <NavItem 
              to="/suporte" 
              icon="fa-circle-question" 
              label="Suporte" 
              active={location.pathname === '/suporte'} 
              collapsed={collapsed} 
          />
        </div>
      </nav>

      {/* Social Links Sidebar */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-slate-800/50 flex items-center justify-around transition-all mt-auto">
          <a href="https://www.instagram.com/cardumy/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-pink-500 transition-colors p-1.5"><i className="fab fa-instagram"></i></a>
          <a href="https://chat.whatsapp.com/CdX5OCXmlojHTutlbjEqId" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-500 transition-colors p-1.5"><i className="fab fa-whatsapp"></i></a>
          <a href="https://discord.gg/hNWvmdz6ja" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-400 transition-colors p-1.5"><i className="fab fa-discord"></i></a>
        </div>
      )}
    </div>
  );
};
