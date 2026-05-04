import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../services/supabaseService';

interface Address {
    id: number;
    street: string;
    number: string;
    neighborhood: string;
    complement: string;
    city: string;
    state: string;
    zip_code: string;
    is_primary: boolean;
}

export const ManageAddresses: React.FC = () => {
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        street: '',
        number: '',
        neighborhood: '',
        complement: '',
        city: '',
        state: '',
        zip_code: '',
        is_primary: false
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        setLoading(true);
        try {
            const data = await getAddresses();
            setAddresses(data);
        } catch (error) {
            console.error('Error loading addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                await updateAddress(isEditing, formData);
            } else {
                await createAddress(formData);
            }
            await loadAddresses();
            resetForm();
        } catch (error) {
            console.error('Error saving address:', error);
            alert('Erro ao salvar endereço. Verifique os dados.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este endereço?')) return;
        try {
            await deleteAddress(id);
            await loadAddresses();
        } catch (error) {
            console.error('Error deleting address:', error);
            alert('Erro ao excluir endereço.');
        }
    };

    const resetForm = () => {
        setFormData({
            street: '',
            number: '',
            neighborhood: '',
            complement: '',
            city: '',
            state: '',
            zip_code: '',
            is_primary: false
        });
        setIsAdding(false);
        setIsEditing(null);
    };

    const startEdit = (address: Address) => {
        setFormData({
            street: address.street,
            number: address.number,
            neighborhood: address.neighborhood,
            complement: address.complement || '',
            city: address.city,
            state: address.state,
            zip_code: address.zip_code,
            is_primary: address.is_primary
        });
        setIsEditing(address.id);
        setIsAdding(true);
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8 text-white">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter">MEUS ENDEREÇOS</h1>
                    <p className="text-slate-400 text-sm">Gerencie seus endereços de entrega</p>
                </div>
                {!isAdding && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center space-x-2 shadow-lg shadow-purple-600/20"
                    >
                        <i className="fas fa-plus"></i>
                        <span>NOVO ENDEREÇO</span>
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8"
                    >
                        <form onSubmit={handleSave} className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-4">
                                {isEditing ? 'Editar Endereço' : 'Novo Endereço'}
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-black uppercase text-slate-500 mb-2">Rua / Logradouro</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={formData.street}
                                            onChange={e => setFormData({ ...formData, street: e.target.value })}
                                            placeholder="Ex: Rua das Flores"
                                            className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-600"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-black uppercase text-slate-500 mb-2">Número</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={formData.number}
                                            onChange={e => setFormData({ ...formData, number: e.target.value })}
                                            placeholder="Ex: 123"
                                            className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-600"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">Complemento</label>
                                    <input 
                                        type="text" 
                                        value={formData.complement}
                                        onChange={e => setFormData({ ...formData, complement: e.target.value })}
                                        placeholder="Ex: Ap 4, Bloco B"
                                        className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">Bairro</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.neighborhood}
                                        onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                                        placeholder="Ex: Centro"
                                        className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">Cidade</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Ex: São Paulo"
                                        className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-600"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-500 mb-2">UF</label>
                                        <input 
                                            required
                                            type="text" 
                                            maxLength={2}
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                            placeholder="SP"
                                            className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-500 mb-2">CEP</label>
                                        <input 
                                            required
                                            type="text" 
                                            maxLength={8}
                                            value={formData.zip_code}
                                            onChange={e => setFormData({ ...formData, zip_code: e.target.value.replace(/\D/g, '') })}
                                            placeholder="00000000"
                                            className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <input 
                                    type="checkbox" 
                                    id="is_primary"
                                    checked={formData.is_primary}
                                    onChange={e => setFormData({ ...formData, is_primary: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-600"
                                />
                                <label htmlFor="is_primary" className="text-sm text-slate-300 font-medium cursor-pointer">
                                    Definir como endereço padrão
                                </label>
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button 
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-black text-sm transition-all shadow-lg shadow-purple-600/20"
                                >
                                    {saving ? 'SALVANDO...' : 'SALVAR ENDEREÇO'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    Array(2).fill(0).map((_, i) => (
                        <div key={i} className="h-48 bg-slate-900/50 border border-slate-800/50 rounded-2xl animate-pulse" />
                    ))
                ) : addresses.length === 0 ? (
                    <div className="md:col-span-2 text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
                        <i className="fas fa-map-location-dot text-4xl text-slate-700 mb-4 block"></i>
                        <p className="text-slate-500 font-medium">Nenhum endereço cadastrado.</p>
                        <button 
                            onClick={() => setIsAdding(true)}
                            className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-bold"
                        >
                            Clique aqui para adicionar seu primeiro endereço
                        </button>
                    </div>
                ) : (
                    addresses.map(address => (
                        <motion.div 
                            layout
                            key={address.id}
                            className={`p-6 rounded-2xl border transition-all ${address.is_primary ? 'bg-purple-600/10 border-purple-500/50 shelf-glow' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-2">
                                    <div className={`p-2 rounded-lg ${address.is_primary ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                        <i className="fas fa-map-marker-alt"></i>
                                    </div>
                                    {address.is_primary && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-400/10 px-2 py-1 rounded">PADRÃO</span>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => startEdit(address)}
                                        className="p-2 text-slate-500 hover:text-white transition-colors"
                                        title="Editar"
                                    >
                                        <i className="fas fa-pen"></i>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(address.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                        title="Excluir"
                                    >
                                        <i className="fas fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <p className="text-white font-bold leading-tight">{address.street}, {address.number}</p>
                                {address.complement && <p className="text-slate-300 text-xs">{address.complement}</p>}
                                <p className="text-slate-400 text-sm">{address.neighborhood}, {address.city}, {address.state}</p>
                                <p className="text-slate-500 text-xs font-mono">CEP: {address.zip_code}</p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
