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
    className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 group ${
      active
        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 translate-x-2'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <div className={`w-6 h-6 flex items-center justify-center`}>
      <i className={`fas ${icon} ${active ? 'text-white' : 'group-hover:text-purple-400'}`}></i>
    </div>
    {!collapsed && <span className="font-bold whitespace-nowrap">{label}</span>}
  </Link>
);

export const Sidebar: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isLojista = user?.role_id === 6;

  const lojistaItems = [
    { to: '/', icon: 'fa-house', label: 'Início', active: location.pathname === '/' },
    { to: '/minha-loja', icon: 'fa-briefcase', label: 'Minha Loja', active: location.pathname === '/minha-loja' },
    { to: '/produtos', icon: 'fa-bag-shopping', label: 'Produtos', active: location.pathname === '/produtos' },
    { to: '/gerenciar-estoque', icon: 'fa-box-archive', label: 'Estoque', active: location.pathname === '/gerenciar-estoque' },
    { to: '/meus-torneios', icon: 'fa-calendar-check', label: 'Meus Torneios', active: location.pathname === '/meus-torneios' || location.pathname === '/novo-torneio' },
    { to: '/pedidos-recebidos', icon: 'fa-ticket', label: 'Meus Ingressos', active: location.pathname === '/pedidos-recebidos' },
    { to: '/suporte', icon: 'fa-circle-question', label: 'Suporte', active: location.pathname === '/suporte' },
  ];

  // common items for members
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
    <div className="flex flex-col h-full py-6">
      <div className="px-4 mb-8">
        {!collapsed ? (
            <h1 className="text-2xl font-black text-white tracking-tighter">CARDUMY<span className="text-purple-500">.</span></h1>
        ) : (
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center font-black text-white ml-1">C</div>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-2 overflow-y-auto no-scrollbar">
        {isLojista ? (
          <>
            {!collapsed && <p className="px-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Geral</p>}
            <NavItem 
              to={lojistaItems[0].to} 
              icon={lojistaItems[0].icon} 
              label={lojistaItems[0].label} 
              active={lojistaItems[0].active} 
              collapsed={collapsed} 
            />

            <div className="my-6 border-t border-slate-800/50" />
            {!collapsed && <p className="px-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Minha Loja</p>}
            <NavItem {...lojistaItems[1]} collapsed={collapsed} />
            <NavItem {...lojistaItems[3]} collapsed={collapsed} />

            <div className="my-6 border-t border-slate-800/50" />
            {!collapsed && <p className="px-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Catálogo</p>}
            <NavItem {...lojistaItems[2]} collapsed={collapsed} />

            <div className="my-6 border-t border-slate-800/50" />
            {!collapsed && <p className="px-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Eventos</p>}
            <NavItem {...lojistaItems[4]} collapsed={collapsed} />
            <NavItem {...lojistaItems[5]} collapsed={collapsed} />

            <div className="my-6 border-t border-slate-800/50" />
            {!collapsed && <p className="px-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Suporte</p>}
            <NavItem {...lojistaItems[6]} collapsed={collapsed} />
          </>
        ) : (
          <>
            {commonTopItems.map((item) => (
              <NavItem key={item.to} {...item} collapsed={collapsed} />
            ))}

            <div className="my-6 border-t border-slate-800/50" />
            
            {!collapsed && <p className="px-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Membro</p>}
            {memberItems.map((item) => (
              <NavItem key={item.to} {...item} collapsed={collapsed} />
            ))}
            
            <div className="px-3 mt-4">
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
