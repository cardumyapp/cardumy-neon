
import React, { useState, useMemo } from 'react';
import { GAMES, MOCK_RANKING, MOCK_UPDATES, MOCK_ACTIONS } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { GameType } from '../types';

interface DashboardProps {
  activeGame: GameType | 'All';
}

export const Dashboard: React.FC<DashboardProps> = ({ activeGame }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredActions = useMemo(() => {
    // Note: Since MOCK_ACTIONS doesn't have game info currently, we mock filtering 
    // by pretending some cards belong to specific games based on their target string
    if (activeGame === 'All') return MOCK_ACTIONS;
    return MOCK_ACTIONS.filter((_, i) => i % 2 === 0); // Mock logic for filtered view
  }, [activeGame]);

  const messages = [
    "Conectando ao Cardume...",
    "Sincronizando coleções digitais...",
    "Renderizando interfaces holográficas...",
    "Otimizando visualização de decks...",
    "Finalizando sua demonstração exclusiva..."
  ];

  const handleGenerateVideo = async () => {
    try {
      setError(null);
      if (typeof window.aistudio !== 'undefined') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // Trigger the key selection dialog and proceed immediately per guidelines
          window.aistudio.openSelectKey();
        }
      }

      setIsGenerating(true);
      let messageIndex = 0;
      const interval = setInterval(() => {
        setLoadingMessage(messages[messageIndex % messages.length]);
        messageIndex++;
      }, 4000);

      // Create a new GoogleGenAI instance right before the call to ensure current API key usage
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `A cinematic high-tech interface for a Trading Card Game platform called Cardumy focusing on ${activeGame === 'All' ? 'various games' : activeGame}, showing floating holographic cards, digital deck building, and a futuristic social feed with neon purple and slate colors, 4k resolution, smooth motion.`,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      clearInterval(interval);
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if (downloadLink) {
        // Append the API key to the fetch URL for downloading the MP4 bytes
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      } else {
        throw new Error("Falha ao obter o link do vídeo.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setError("Erro de chave de API. Por favor, selecione uma chave válida de um projeto faturado.");
        // Prompt to select key again if entity not found
        if (typeof window.aistudio !== 'undefined') {
          window.aistudio.openSelectKey();
        }
      } else {
        setError("Ocorreu um erro ao gerar o vídeo. Tente novamente.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Dynamic Context Banner */}
      {activeGame !== 'All' && (
        <div className="bg-purple-600/10 border border-purple-500/30 px-6 py-3 rounded-2xl flex items-center justify-between">
           <div className="flex items-center space-x-3">
             <i className="fas fa-filter text-purple-400"></i>
             <p className="text-sm font-bold text-slate-300">
               Dashboard focado em <span className="text-white font-black">{activeGame}</span>
             </p>
           </div>
           <button className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Limpar Foco</button>
        </div>
      )}

      {/* Video Demo Section */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="max-w-xl space-y-4 text-center md:text-left">
            <h3 className="text-2xl font-black text-white">Demonstração da Plataforma</h3>
            <p className="text-slate-400">
              Assista a uma prévia cinematográfica de como a inteligência artificial enxerga o futuro da Cardumy focado em {activeGame === 'All' ? 'seu Cardume' : activeGame}.
            </p>
            {!videoUrl && !isGenerating && (
              <button 
                onClick={handleGenerateVideo}
                className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95"
              >
                <i className="fas fa-play-circle"></i>
                <span>Gerar Vídeo Demonstrativo</span>
              </button>
            )}
            {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
          </div>

          <div className="w-full md:w-1/2 aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden relative group">
            {isGenerating ? (
              <div className="flex flex-col items-center space-y-4 p-8 text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                  <i className="fas fa-magic absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400"></i>
                </div>
                <div className="space-y-1">
                  <p className="text-white font-bold animate-pulse">{loadingMessage || "Iniciando geração..."}</p>
                  <p className="text-xs text-slate-500 italic">Isso pode levar alguns minutos. Por favor, aguarde.</p>
                </div>
              </div>
            ) : videoUrl ? (
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center space-y-3 opacity-40 group-hover:opacity-60 transition-opacity">
                <i className="fas fa-clapperboard text-5xl text-slate-600"></i>
                <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Preview não disponível</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl"></div>
      </section>

      {/* Game Selector (Secondary/Static) */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9 gap-4">
        {GAMES.map((game) => (
          <button 
            key={game.type}
            className={`flex flex-col items-center justify-center p-4 bg-slate-900 border rounded-xl hover:border-purple-500 hover:bg-slate-800 transition-all group ${activeGame === game.type ? 'border-purple-500 bg-slate-800' : 'border-slate-800'}`}
          >
            <i className={`fas ${game.icon} text-2xl mb-2 group-hover:text-purple-400 ${activeGame === game.type ? 'text-purple-400' : 'text-slate-500'}`}></i>
            <span className="text-xs font-semibold whitespace-nowrap">{game.type}</span>
          </button>
        ))}
      </div>

      {/* Stats and Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center space-x-2">
            <i className="fas fa-sparkles text-purple-500"></i>
            <span>Atualizações</span>
          </h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
            {MOCK_UPDATES.map((update, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-slate-500">{update.date}</span>
                  <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-0.5 rounded-full">{update.changes.length} mudança(s)</span>
                </div>
                <ul className="space-y-2">
                  {update.changes.map((change, cIdx) => (
                    <li key={cIdx} className="text-sm flex items-start space-x-2">
                      <i className="fas fa-diamond text-[8px] mt-1.5 text-purple-500"></i>
                      <span className="text-slate-300">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center space-x-2">
            <i className="fas fa-bolt text-yellow-500"></i>
            <span>Últimas Ações</span>
          </h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800">
            {filteredActions.length > 0 ? filteredActions.map((action, idx) => (
              <div key={idx} className="py-4 flex items-center space-x-4 group">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-purple-400 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  {action.user[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-bold text-white">{action.user}</span> {action.action} a carta <span className="font-mono text-purple-400">{action.target}</span>
                  </p>
                  <p className="text-xs text-slate-500">{action.timestamp}</p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-500 text-sm italic">Nenhuma ação recente para este foco.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center space-x-2">
              <i className="fas fa-trophy text-amber-500"></i>
              <span>Ranking Coleção</span>
            </h3>
            <button className="text-xs text-slate-500 hover:text-white">Ver mais →</button>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            {MOCK_RANKING.map((rank) => (
              <div key={rank.rank} className="p-4 flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-800 last:border-none">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img src={rank.avatar} className="w-10 h-10 rounded-full" alt={rank.name} />
                    {rank.isTop && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-[10px] p-0.5 rounded-full border border-slate-900">
                        <i className="fas fa-crown text-white"></i>
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{rank.name}</p>
                    <p className="text-xs text-slate-500">{rank.cards} cartas</p>
                  </div>
                </div>
                <span className={`font-mono font-black text-xl ${rank.rank === 1 ? 'text-amber-500' : 'text-slate-600'}`}>
                  #{rank.rank}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
