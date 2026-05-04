import React from 'react';
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

export const Sidebar: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isLojista = user?.role_id === 6 || user?.role_id === 1;

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
    { to: '/social', icon: 'fa-users', label: 'Social', active: location.pathname === '/social' },
    { to: '/pastas', icon: 'fa-folder', label: 'Minhas Cartas', active: location.pathname === '/pastas' },
    { to: '/decks', icon: 'fa-layer-group', label: 'Meus Decks', active: location.pathname === '/decks' },
    { to: '/pedidos', icon: 'fa-clipboard-list', label: 'Meus Pedidos', active: location.pathname === '/pedidos' },
    { to: '/perfil', icon: 'fa-user-circle', label: 'Meu Perfil', active: location.pathname === '/perfil' },
  ];

  return (
    <div className="flex flex-col h-full py-4">
      <div className={`p-6 mb-2 flex items-center ${collapsed ? 'justify-center w-full' : 'space-x-3'}`}>
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-lg shadow-lg shadow-purple-600/20">
          <i className="fas fa-fish-fins text-white text-xl"></i>
        </div>
        {!collapsed && <span className="text-xl font-bold tracking-tight text-white transition-opacity duration-300">Cardumy</span>}
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

            <div className="mt-4 pt-4 border-t border-slate-800/50">
              <NavItem 
                  to="/suporte" 
                  icon="fa-circle-question" 
                  label="Suporte" 
                  active={location.pathname === '/suporte'} 
                  collapsed={collapsed} 
              />
            </div>
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
            
            <div className="mt-4 pt-4 border-t border-slate-800/50">
              <NavItem 
                  to="/suporte" 
                  icon="fa-circle-question" 
                  label="Suporte" 
                  active={location.pathname === '/suporte'} 
                  collapsed={collapsed} 
              />
            </div>
          </>
        )}
      </nav>
    </div>
  );
};
