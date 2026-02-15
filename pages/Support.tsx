
import React, { useState } from 'react';

export const SupportPage: React.FC = () => {
  const [formType, setFormType] = useState('bug');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const faq = [
    { q: "Como vendo minhas cartas no Cardumy?", a: "Para vender, você deve estar cadastrado como Lojista Parceiro. Entre em contato via contato@cardumy.com para saber mais." },
    { q: "O Cardumy garante a entrega?", a: "Nós conectamos você aos lojistas. Cada loja é responsável por seu envio, mas oferecemos suporte e mediação." },
    { q: "Como funciona o ranking global?", a: "O ranking é baseado na quantidade e valor das cartas únicas em sua 'Minha Coleção'." },
    { q: "Posso importar decks de outros sites?", a: "Sim, suportamos arquivos .txt e .json dos principais simuladores de TCG." },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setMessage(''); }, 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
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
          <div className="space-y-6">
            {faq.map((item, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
                <h4 className="font-bold text-slate-200 mb-2 text-sm">{item.q}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-8 md:p-10 shadow-2xl space-y-8">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase">Fale Conosco</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Erros ou Sugestões</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              {['bug', 'sugestao'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormType(type)}
                  className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
                    formType === type ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}
                >
                  {type === 'bug' ? 'Relatar Erro' : 'Sugestão'}
                </button>
              ))}
            </div>

            <textarea 
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-800"
              placeholder="Descreva o que aconteceu..."
            ></textarea>

            {submitted ? (
              <div className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-center text-xs font-bold">
                Recebemos sua mensagem!
              </div>
            ) : (
              <button className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl hover:bg-purple-400 transition-colors uppercase tracking-widest text-xs">
                Enviar Mensagem
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
