import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';

export const SessionCheck: React.FC = () => {
    const navigate = useNavigate();
    const { logout, supabaseUser, confirmAndLoadProfile } = useAuth();
    const [confirming, setConfirming] = useState(false);

    const handleProceed = async () => {
        setConfirming(true);
        try {
            await confirmAndLoadProfile();
            navigate('/');
        } catch (error) {
            console.error('Falha ao confirmar sessão:', error);
            alert('Erro ao carregar perfil da plataforma.');
        } finally {
            setConfirming(false);
        }
    };

    if (!supabaseUser) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
                {confirming ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                        <div className="text-center">
                            <h2 className="text-xl font-black tracking-tight text-white uppercase italic">Iniciando Plataforma</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Carregando seus dados...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -ml-32 -mb-32"></div>

                        <div className="relative z-10 text-center mb-8">
                            <div className="bg-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-600/20">
                                <i className="fas fa-shield-halved text-2xl text-white"></i>
                            </div>
                            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase italic">Verificação de Sessão</h1>
                            <p className="text-slate-400 font-medium">Sua conexão com o Supabase está ativa</p>
                            <div className="mt-4 inline-flex items-center space-x-2 bg-slate-950 px-4 py-2 rounded-full border border-slate-800">
                                <i className="fas fa-circle text-[8px] text-emerald-500 animate-pulse"></i>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Modo Isolado Ativo</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800/50">
                                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Dados da Conta</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-xs font-bold uppercase">Email:</span>
                                        <span className="text-white text-sm font-mono truncate ml-4 font-bold">{supabaseUser.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                                        <span className="text-slate-400 text-xs font-bold uppercase">Auth ID (UUID):</span>
                                        <span className="text-white text-[10px] font-mono truncate ml-4 opacity-60">{supabaseUser.id}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                                        <span className="text-slate-400 text-xs font-bold uppercase">Provedor:</span>
                                        <span className="text-white text-xs font-black uppercase text-purple-400">{supabaseUser.app_metadata?.provider || 'Supabase Auth'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800/50">
                                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Metadados de Segurança</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-xs font-bold uppercase">Segurança (MFA):</span>
                                        <span className="text-white text-xs font-black uppercase text-slate-500">Nível 1 (Padrão)</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                                        <span className="text-slate-400 text-xs font-bold uppercase">Último Login:</span>
                                        <span className="text-white text-xs font-mono">{new Date(supabaseUser.last_sign_in_at).toLocaleString('pt-BR')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={logout}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center space-x-2"
                            >
                                <i className="fas fa-sign-out-alt"></i>
                                <span>FAZER LOGOUT</span>
                            </button>
                            <button 
                                onClick={handleProceed}
                                className="bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/20 group"
                            >
                                <span>ACESSAR PLATAFORMA</span>
                                <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                            </button>
                        </div>
                    </>
                )}

                <p className="text-center mt-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    CARDUMY TCG • SISTEMA DE GERENCIAMENTO DE SESSÃO
                </p>
            </motion.div>
        </div>
    );
};
