
import React, { useState } from 'react';
import { GameType } from '../types';
import { MOCK_CARDS } from '../constants';
import { analyzeDeck } from '../services/gemini';

interface DeckBuilderProps {
  activeGame: GameType | 'All';
}

export const DeckBuilderPage: React.FC<DeckBuilderProps> = ({ activeGame }) => {
  const [deckName, setDeckName] = useState('Novo Deck 1');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeDeck(deckName, ['Gurimon', 'Koromon', 'Huckmon', 'Meramon']);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  // Se não houver um foco de jogo selecionado, solicita ao usuário
  if (activeGame === 'All') {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-slate-900/50 border border-slate-800 rounded-full flex items-center justify-center text-slate-700 shadow-2xl relative">
          <i className="fas fa-hammer text-4xl"></i>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center border-4 border-slate-950">
             <i className="fas fa-exclamation text-[10px] text-white"></i>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Canteiro de Obras Vazio</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
            Para começar a construir um deck, selecione uma franquia de TCG na barra lateral esquerda.
          </p>
        </div>
        <div className="flex space-x-2 opacity-20">
           <i className="fas fa-fish-fins text-slate-500"></i>
           <i className="fas fa-fish-fins text-slate-500"></i>
           <i className="fas fa-fish-fins text-slate-500"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl px-4 py-2 flex items-center space-x-3">
             <i className="fas fa-shield-halved text-purple-400 text-xs"></i>
             <span className="text-sm font-black text-white uppercase tracking-widest">{activeGame}</span>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden md:block"></div>
          <input 
            type="text" 
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm font-bold focus:border-purple-500 outline-none w-64 text-white shadow-xl"
            placeholder="Nome do Deck"
          />
        </div>
        <div className="flex space-x-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/5 shadow-md">Importar</button>
          <button className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-black text-xs transition-all shadow-lg shadow-purple-600/20">Salvar Deck</button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
        {/* Left Side: List */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900/50 rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
             <div className="flex items-center space-x-2">
               <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Lista do Deck</h3>
               <span className="bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded-full">55/60</span>
             </div>
             <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="text-[10px] font-black uppercase bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-600/30 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 flex items-center space-x-2"
             >
               <i className="fas fa-sparkles"></i>
               <span>{isAnalyzing ? 'Analisando...' : 'Pedir IA'}</span>
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            {analysis && (
              <div className="bg-indigo-950/30 border border-indigo-800/50 p-4 rounded-2xl text-xs text-indigo-200 mb-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between mb-2">
                  <span className="font-black flex items-center space-x-2 text-indigo-400 uppercase tracking-widest">
                    <i className="fas fa-brain"></i>
                    <span>Sugerido pela IA</span>
                  </span>
                  <button onClick={() => setAnalysis(null)} className="text-indigo-400 hover:text-white transition-colors">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <p className="leading-relaxed italic">"{analysis}"</p>
              </div>
            )}

            <div>
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Linha Evolutiva / Eggs</h4>
              <ul className="space-y-1">
                <li className="flex justify-between items-center text-sm p-3 hover:bg-slate-800/50 rounded-2xl group transition-colors cursor-pointer">
                  <span className="text-purple-400 font-bold">Gurimon</span>
                  <div className="flex items-center space-x-3">
                    <button className="bg-slate-950 w-6 h-6 flex items-center justify-center rounded-lg text-xs hover:bg-slate-800 transition-colors border border-slate-800">-</button>
                    <span className="font-black text-white w-4 text-center">4</span>
                    <button className="bg-slate-950 w-6 h-6 flex items-center justify-center rounded-lg text-xs hover:bg-slate-800 transition-colors border border-slate-800">+</button>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Deck Principal</h4>
              <ul className="space-y-1">
                {['Huckmon', 'Meramon', 'SkullMeramon', 'BaoHuckmon', 'SaviorHuckmon'].map((card) => (
                  <li key={card} className="flex justify-between items-center text-sm p-3 hover:bg-slate-800/50 rounded-2xl group transition-colors cursor-pointer">
                    <span className="text-slate-300 font-medium">{card}</span>
                    <div className="flex items-center space-x-3">
                      <button className="bg-slate-950 w-6 h-6 flex items-center justify-center rounded-lg text-xs border border-slate-800">-</button>
                      <span className="font-black text-white w-4 text-center">4</span>
                      <button className="bg-slate-950 w-6 h-6 flex items-center justify-center rounded-lg text-xs border border-slate-800">+</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Search */}
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6 min-h-0">
          <div className="flex items-center space-x-4 bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex-1 flex items-center space-x-3">
              <i className="fas fa-search text-slate-600"></i>
              <input type="text" placeholder={`Buscar cartas de ${activeGame}...`} className="bg-transparent border-none focus:outline-none w-full text-sm font-medium" />
            </div>
            <div className="hidden md:flex space-x-2">
              <div className="bg-purple-600/10 text-purple-400 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-purple-600/20">Cards</div>
              <div className="bg-slate-800 text-slate-400 text-[10px] font-black uppercase px-3 py-1 rounded-full">Staples</div>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-black uppercase shadow-lg shadow-purple-600/20 transition-all">Filtrar</button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
               {MOCK_CARDS.filter(c => c.game === activeGame).map(card => (
                 <div key={card.id} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 group hover:border-purple-500 cursor-pointer shadow-lg transition-all active:scale-95">
                   <div className="aspect-[3/4.2] overflow-hidden">
                     <img src={card.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={card.name} />
                   </div>
                   <div className="p-3 text-center text-[10px] font-black uppercase tracking-tight truncate bg-slate-950/50 text-slate-400 group-hover:text-white transition-colors">{card.name}</div>
                 </div>
               ))}
               {MOCK_CARDS.filter(c => c.game === activeGame).length === 0 && (
                 <div className="col-span-full py-20 text-center opacity-30 italic text-sm">
                   Nenhuma carta de {activeGame} encontrada para pré-visualização.
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
