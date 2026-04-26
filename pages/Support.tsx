
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const SupportPage: React.FC = () => {
  const [category, setCategory] = useState('Bug');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faq = [
    { q: "Como vendo minhas cartas no Cardumy?", a: "Para vender, você deve estar cadastrado como Lojista Parceiro. Entre em contato via contato@cardumy.com para saber mais." },
    { q: "O Cardumy garante a entrega?", a: "Nós conectamos você aos lojistas. Cada loja é responsável por seu envio, mas oferecemos suporte e mediação." },
    { q: "Como funciona o ranking global?", a: "O ranking é baseado na quantidade e valor das cartas únicas em sua 'Minha Coleção'." },
    { q: "Posso importar decks de outros sites?", a: "Sim, suportamos arquivos .txt e .json dos principais simuladores de TCG." },
  ];

  const categories = [
    "Bug",
    "Conta",
    "Produto faltando",
    "Carta faltando",
    "Carta Incorreta",
    "Reportar Usuário",
    "Reportar Lojista",
    "Outro"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setMessage(''); }, 5000);
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20 px-4 md:px-0">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-purple-600/10 rounded-full flex items-center justify-center text-purple-400 mx-auto border border-purple-500/20">
          <i className="fas fa-headset text-3xl"></i>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Central de Ajuda</h2>
        <p className="text-slate-400 max-w-md mx-auto">Tudo o que você precisa para navegar com segurança no cardume.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h3 className="text-xl font-black text-white uppercase flex items-center">
            <i className="fas fa-clipboard-question text-purple-500 mr-3"></i>
            FAQ
          </h3>
          <div className="space-y-3">
            {faq.map((item, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-5 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <h4 className="font-bold text-slate-200 text-sm">{item.q}</h4>
                  <i className={`fas fa-chevron-down text-[10px] text-slate-500 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`}></i>
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-5 border-t border-slate-800/50 pt-4">
                        <p className="text-xs text-slate-500 leading-relaxed italic">{item.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-6 md:p-10 shadow-2xl space-y-8 h-fit">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase">Fale Conosco</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Suporte Técnico e Denúncias</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
              <div className="relative">
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-colors appearance-none cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none"></i>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mensagem</label>
              <textarea 
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-800 text-white"
                placeholder="Descreva detalhadamente o ocorrido..."
              ></textarea>
            </div>

            {submitted ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-center text-xs font-bold"
              >
                <i className="fas fa-check-circle mr-2"></i>
                Recebemos sua mensagem! Nossa equipe entrará em contato em breve.
              </motion.div>
            ) : (
              <button className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl hover:bg-purple-400 transition-colors uppercase tracking-widest text-xs flex items-center justify-center space-x-2">
                <span>Enviar Solicitação</span>
                <i className="fas fa-paper-plane text-[10px]"></i>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

