
import React from 'react';
import { MOCK_RANKING, MOCK_ACTIONS } from '../constants';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const Social: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Feed de Atividade */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Comunidade</h1>
          <p className="text-slate-400 text-sm mt-1">Veja o que o cardume está fazendo agora.</p>
        </div>

        <div className="space-y-4">
          {MOCK_ACTIONS.map((action, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4 group hover:border-purple-500/30 transition-all"
            >
              <Link to={`/perfil/${action.userId}`}>
                <img src={action.avatar || `https://i.pravatar.cc/150?u=${action.user}`} className="w-12 h-12 rounded-full border-2 border-slate-800 group-hover:border-purple-500 transition-all" alt="" />
              </Link>
              <div className="flex-1">
                <p className="text-sm text-slate-300">
                  <Link to={`/perfil/${action.userId}`} className="font-bold text-white hover:text-purple-400 cursor-pointer transition-colors">{action.user}</Link>
                  {' '}{action.action}{' '}
                  <span className="font-bold text-purple-400 cursor-pointer hover:underline">{action.target}</span>
                </p>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">{action.timestamp}</span>
              </div>
              <button className="p-2 text-slate-500 hover:text-pink-500 transition-colors">
                <i className="far fa-heart"></i>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ranking & Sugestões */}
      <div className="space-y-8">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center justify-between">
            Ranking Global
            <i className="fas fa-trophy text-yellow-500"></i>
          </h3>
          <div className="space-y-4">
            {MOCK_RANKING.map((item) => (
              <Link key={item.rank} to={`/perfil/${item.userId}`} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 text-center font-mono text-xs ${item.rank <= 3 ? 'text-purple-400 font-bold' : 'text-slate-600'}`}>
                    {item.rank}
                  </div>
                  <img src={item.avatar} className="w-8 h-8 rounded-full border border-slate-800 group-hover:border-purple-500 transition-all" alt="" />
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white">{item.cards}</span>
                  <span className="text-[9px] text-slate-500 uppercase block leading-none">Cartas</span>
                </div>
              </Link>
            ))}
          </div>
          <button className="w-full mt-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5">
            Ver Ranking Completo
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-2">Convide Amigos</h3>
          <p className="text-slate-400 text-xs mb-4 leading-relaxed">Ganhe badges exclusivos e suba no ranking ao trazer novos membros para o cardume.</p>
          <button className="w-full py-2.5 bg-white text-slate-950 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all">
            Gerar Link de Convite
          </button>
        </div>
      </div>
    </div>
  );
};
