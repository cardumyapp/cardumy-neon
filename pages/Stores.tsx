
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_STORES, MOCK_PRODUCTS } from '../constants';

export const Stores: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Identifica quais IDs de loja possuem produtos no marketplace
  const storesWithProducts = useMemo(() => {
    return new Set(MOCK_PRODUCTS.map(p => p.storeId));
  }, []);

  const filteredStores = useMemo(() => {
    return MOCK_STORES.filter(store => {
      // Filtro de Busca (Nome ou Cidade)
      const searchMatch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         store.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtro de "Compra disponível" (Apenas lojas com produtos no estoque)
      const availabilityMatch = onlyAvailable ? storesWithProducts.has(store.id) : true;

      return searchMatch && availabilityMatch;
    });
  }, [searchQuery, onlyAvailable, storesWithProducts]);

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-700 px-4 md:px-0">
      {/* Hero Header Simples */}
      <div className="relative mb-8 rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/5"></div>
        <div className="relative px-6 py-8 md:px-12 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-tight">Lojas Parceiras</h2>
            <p className="text-slate-400 text-xs md:text-base max-w-lg">
              Conecte-se com as melhores lojas de TCG do Brasil e encontre tudo para o seu deck.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
             <div className="bg-slate-950/40 border border-white/5 px-4 py-2 rounded-xl">
               <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{filteredStores.length} Lojas encontradas</span>
             </div>
          </div>
        </div>
      </div>

      {/* Filter Bar - Static (Não acompanha rolagem) */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          {/* Barra de Busca Principal */}
          <div className="relative flex-1">
            <i className="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
            <input 
              type="text" 
              placeholder="Buscar por nome ou cidade..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Checkbox "Compra disponível" estilizado */}
          <button 
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl border transition-all active:scale-95 ${
              onlyAvailable 
              ? 'bg-purple-600/20 border-purple-500/50 text-purple-300' 
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              onlyAvailable ? 'bg-purple-600 border-purple-400' : 'border-slate-700 bg-slate-950'
            }`}>
              {onlyAvailable && <i className="fas fa-check text-[10px] text-white"></i>}
            </div>
            <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">Compra disponível</span>
          </button>
        </div>
      </div>

      {/* Grid de Lojas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredStores.map((store) => (
          <div 
            key={store.id} 
            className={`group relative bg-slate-900/40 rounded-3xl border transition-all duration-500 hover:-translate-y-1 overflow-hidden flex flex-col ${
              store.isPartner 
              ? 'border-purple-500/20 hover:border-purple-500 shadow-xl' 
              : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Store Cover Image */}
            <div className="h-28 w-full overflow-hidden relative">
              <img 
                src={`https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=600`} 
                className="w-full h-full object-cover brightness-[0.3] group-hover:scale-110 transition-transform duration-1000" 
                alt="Store Interior" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
              
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                {store.isPartner && (
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    Parceiro
                  </span>
                )}
                {storesWithProducts.has(store.id) && (
                  <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-1.5 rounded-lg backdrop-blur-sm" title="Produtos em estoque">
                    <i className="fas fa-bag-shopping text-[10px]"></i>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 -mt-10 relative z-10 flex flex-col flex-1">
              <div className="mb-4">
                <div className="relative inline-block">
                  <div className="absolute -inset-1 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <img src={store.logo} className="relative w-20 h-20 rounded-2xl object-cover border-4 border-slate-950 bg-slate-800 shadow-xl" alt={store.name} />
                </div>
              </div>

              <div className="space-y-1 mb-6 flex-1">
                <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors truncate">{store.name}</h3>
                <div className="flex items-center text-slate-500 text-[10px] md:text-xs space-x-2 font-medium">
                  <i className="fas fa-location-dot text-pink-500/70"></i>
                  <span className="truncate uppercase tracking-tight">{store.location}</span>
                </div>
              </div>

              <Link 
                to={`/loja/${store.id}`}
                className="w-full bg-slate-800 hover:bg-purple-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2 border border-white/5 text-xs uppercase tracking-widest"
              >
                <span>Acessar Loja</span>
                <i className="fas fa-arrow-right text-[10px] transition-transform group-hover:translate-x-1"></i>
              </Link>
            </div>
          </div>
        ))}

        {filteredStores.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4 bg-slate-900/10 rounded-[32px] border border-dashed border-slate-800/50">
             <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-store-slash text-2xl text-slate-700"></i>
             </div>
             <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Nenhuma loja atende aos critérios.</p>
             <button 
              onClick={() => { setSearchQuery(''); setOnlyAvailable(false); }}
              className="text-purple-400 font-black text-[10px] uppercase hover:text-white transition-colors"
             >
               Redefinir Filtros
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
