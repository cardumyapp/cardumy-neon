
import React from 'react';
import { motion } from 'motion/react';

export const SupportPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-white">Central de Suporte</h1>
        <p className="text-slate-400 max-w-lg mx-auto">Precisa de ajuda? Nosso cardume está pronto para te ajudar com qualquer dúvida ou problema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: 'fa-box', label: 'Pedidos', desc: 'Problemas com entrega ou produtos' },
          { icon: 'fa-user-gear', label: 'Conta', desc: 'Acesso e segurança do seu perfil' },
          { icon: 'fa-handshake', label: 'Parcerias', desc: 'Como vender no Cardumy' }
        ].map(card => (
          <div key={card.label} className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl text-center space-y-4 hover:border-purple-500/50 transition-all group">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-500 group-hover:text-purple-400 group-hover:bg-purple-400/10 transition-all">
              <i className={`fas ${card.icon} text-2xl`}></i>
            </div>
            <h3 className="font-bold text-white uppercase tracking-wider text-sm">{card.label}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 md:p-12">
          <h2 className="text-2xl font-black text-white mb-8">Envie uma Mensagem</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seu Nome</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-purple-500 transition-all text-white" placeholder="João Silva" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail de Contato</label>
                <input type="email" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-purple-500 transition-all text-white" placeholder="joao@exemplo.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sua Mensagem</label>
              <textarea rows={5} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-purple-500 transition-all text-white resize-none" placeholder="Como podemos ajudar?"></textarea>
            </div>
            <button className="bg-purple-600 hover:bg-purple-500 text-white font-black px-12 py-4 rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95">
              Enviar Solicitação
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
