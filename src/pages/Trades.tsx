
import React from 'react';
import { motion } from 'motion/react';

export const Trades: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white">Centro de Trocas</h1>
          <p className="text-slate-500 text-sm">Conecte-se com outros mestres e feche negócios épicos.</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-500 text-white font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 flex items-center space-x-3 self-start">
           <i className="fas fa-plus text-xs"></i>
           <span>Nova Proposta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 space-y-6">
           <div className="flex items-center space-x-4 pb-4 border-b border-slate-800">
              <button className="text-sm font-black uppercase tracking-widest text-white border-b-2 border-purple-600 pb-2">Ativas</button>
              <button className="text-sm font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors pb-2">Pendentes</button>
              <button className="text-sm font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors pb-2">Histórico</button>
           </div>

           <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-16 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600 mb-4">
                <i className="fas fa-right-left text-2xl"></i>
              </div>
              <h3 className="font-bold text-white leading-none">Nenhuma troca ativa</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">Você ainda não iniciou nenhuma troca. Use a aba Comunidade para encontrar outros jogadores.</p>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white space-y-6 shadow-xl shadow-purple-600/10">
              <h2 className="text-xl font-black italic">Dica Pro:</h2>
              <p className="text-sm font-medium leading-relaxed opacity-90">Sempre verifique a aprovação do outro mestre em seu perfil antes de enviar itens de alto valor.</p>
              <div className="flex items-center space-x-3 pt-4">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-shield-halved"></i>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest">Trade Seguro Cardumy</span>
              </div>
           </div>

           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
              <h3 className="font-black text-white text-sm uppercase tracking-widest">Seu Status</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Taxa de Conclusão</p>
                    <p className="text-xl font-black text-white">100%</p>
                 </div>
                 <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reputação</p>
                    <p className="text-xl font-black text-emerald-400">9.8</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
