
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { useNotification } from '../components/NotificationProvider';
import { 
  getBinderWithCards, 
  getListCards, 
  removeCardFromList, 
  removeCardFromBinder,
  deleteBinder,
  moveCardBetweenLists,
  updateCardQuantityInList,
  updateCardQuantityInBinder,
  getCardgames
} from '../services/supabaseService';
import { motion, AnimatePresence } from 'motion/react';
import { Card, GameType } from '../types';

interface BinderCard extends Card {
  dbId: any;
  quantity?: number;
}

export const FolderDetails: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get('user');
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [folder, setFolder] = useState<any>(null);
  const [cards, setCards] = useState<BinderCard[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isDeletingBinder, setIsDeletingBinder] = useState(false);

  const isSystem = folderId === 'colecao' || folderId === 'wishlist' || folderId === 'offerlist';
  const effectiveUserId = ownerId || currentUser?.id;
  const canEdit = !ownerId || ownerId === currentUser?.id?.toString();

  useEffect(() => {
    if (!effectiveUserId || !folderId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch games for filter
        const gamesList = await getCardgames();
        setGames(gamesList || []);

        if (isSystem) {
          const listType = folderId === 'colecao' ? 'cards' : folderId as any;
          const titles: any = { colecao: 'Coleção', wishlist: 'Wishlist', offerlist: 'Offerlist (Trocas)' };
          const icons: any = { colecao: 'fa-box-archive', wishlist: 'fa-heart', offerlist: 'fa-right-left' };
          const colors: any = { colecao: 'bg-purple-600', wishlist: 'bg-pink-600', offerlist: 'bg-emerald-600' };

          setFolder({
            id: folderId,
            name: ownerId ? `${titles[folderId]}` : `Minha ${titles[folderId]}`,
            icon: icons[folderId],
            color: colors[folderId],
            isSystem: true
          });

          // Hack to use real-time or just initial fetch
          getListCards(effectiveUserId, listType, (data) => {
             const mappedCards: BinderCard[] = data.map(c => ({
                id: c.card_id, // Important: use card_id for management
                dbId: c.id,    // Database row ID
                name: c.name,
                imageUrl: c.image_url,
                game: c.game as GameType,
                quantity: c.quantidade,
                rarity: c.raridade,
                code: c.card_id,
                set: c.game
             }));
             setCards(mappedCards);
             setLoading(false);
          });
        } else {
          const data = await getBinderWithCards(effectiveUserId, folderId);
          if (data) {
            setFolder({
              ...data,
              icon: 'fa-folder',
              color: 'bg-slate-800'
            });
            const mappedCards: BinderCard[] = (data.cards || []).map((c: any) => ({
              id: c.card_id,
              dbId: c.id,
              name: c.name,
              imageUrl: c.image_url,
              game: c.game as GameType,
              quantity: c.quantidade,
              rarity: c.raridade,
              code: c.card_id,
              set: c.game
            }));
            setCards(mappedCards);
          } else {
            navigate('/pastas');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching folder details:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [effectiveUserId, folderId, navigate, isSystem]);

  const handleRemoveCard = async (card: any) => {
    if (!currentUser || !folderId) return;
    try {
      if (isSystem) {
        const listType = folderId === 'colecao' ? 'cards' : folderId as any;
        await removeCardFromList(currentUser.id, listType, card.id);
      } else {
        await removeCardFromBinder(folderId, card.dbId);
      }
      showNotification(`${card.name} removido de ${folder.name}`, 'info');
      setCards(prev => prev.filter(c => c.dbId !== card.dbId));
    } catch (error) {
      console.error('Error removing card:', error);
      showNotification('Erro ao remover carta', 'error');
    }
  };

  const handleUpdateQuantity = async (card: BinderCard, delta: number) => {
    if (!currentUser || !folderId || !canEdit) return;
    
    const currentQuantity = card.quantity || 1;
    const newQuantity = currentQuantity + delta;
    
    if (newQuantity < 1) {
      handleRemoveCard(card);
      return;
    }

    try {
      if (isSystem) {
        const listType = folderId === 'colecao' ? 'cards' : folderId as any;
        await updateCardQuantityInList(currentUser.id, listType, card.id, newQuantity);
      } else {
        await updateCardQuantityInBinder(card.dbId, newQuantity);
      }
      
      setCards(prev => prev.map(c => 
        c.dbId === card.dbId ? { ...c, quantity: newQuantity } : c
      ));
      showNotification(`Quantidade de ${card.name} atualizada para ${newQuantity}`, 'success');
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification('Erro ao atualizar quantidade', 'error');
    }
  };

  const handleDeleteBinder = async () => {
    if (!currentUser || !folderId || isSystem) return;
    if (!window.confirm('Tem certeza que deseja excluir esta pasta?')) return;

    setIsDeletingBinder(true);
    try {
      await deleteBinder(currentUser.id, folderId);
      showNotification(`Pasta "${folder.name}" excluída com sucesso`, 'info');
      navigate('/pastas');
    } catch (error) {
      console.error('Error deleting binder:', error);
      showNotification('Erro ao excluir pasta', 'error');
      setIsDeletingBinder(false);
    }
  };

  const availableGames = useMemo(() => {
    const cardGames = Array.from(new Set(cards.map(c => c.game?.toLowerCase()).filter(Boolean)));
    return games.filter(g => {
      const gameName = g.name.toLowerCase();
      const gameSlug = gameName.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return cardGames.includes(gameName) || cardGames.includes(gameSlug);
    });
  }, [cards, games]);

  const filteredCards = useMemo(() => {
    if (selectedGame === 'all') return cards;
    return cards.filter(c => {
      const cardGame = c.game?.toLowerCase() || '';
      const filterGame = selectedGame.toLowerCase();
      // Simple match or slugified match
      const gameSlug = filterGame.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return cardGame === filterGame || cardGame === gameSlug;
    });
  }, [cards, selectedGame]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!folder) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center space-x-6">
          <Link to="/pastas" className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <i className="fas fa-chevron-left"></i>
          </Link>
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl ${folder.color} flex items-center justify-center text-white text-xl shadow-lg shadow-black/20`}>
              <i className={`fas ${folder.icon}`}></i>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-1">{folder.name}</h2>
              <p className="text-slate-400 text-sm">
                {isSystem ? 'Pasta do Sistema' : `Pasta para ${folder.game_name}`} • {cards.length} cartas
              </p>
            </div>
          </div>
        </div>

        {!isSystem && canEdit && (
          <button 
            onClick={handleDeleteBinder}
            disabled={isDeletingBinder}
            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-6 py-3 rounded-xl transition-all font-bold text-sm flex items-center space-x-2"
          >
            <i className="fas fa-trash-can"></i>
            <span>Excluir Pasta</span>
          </button>
        )}
      </div>

      {cards.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 no-scrollbar px-2">
          <button
            onClick={() => setSelectedGame('all')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${
              selectedGame === 'all' 
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            Todos os Jogos
          </button>
          {availableGames.map(game => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.name)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                selectedGame === game.name 
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {game.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <AnimatePresence>
          {filteredCards.length > 0 ? (
            filteredCards.map((card, idx) => (
              <motion.div 
                key={card.dbId || idx}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-2 hover:border-purple-500 transition-all duration-300"
              >
                <div className="aspect-[3/4.2] rounded-xl overflow-hidden mb-3 bg-slate-950 relative">
                  <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-[10px] font-black px-1.5 py-1 rounded-lg text-white flex items-center space-x-1.5 border border-white/5 z-20">
                    {canEdit && (
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation();
                          handleUpdateQuantity(card, -1); 
                        }}
                        className="w-5 h-5 hover:text-red-400 transition-colors flex items-center justify-center bg-white/5 hover:bg-white/10 rounded flex-shrink-0"
                      >
                        <i className="fas fa-minus text-[7px]"></i>
                      </button>
                    )}
                    <span className="min-w-[12px] text-center">x{card.quantity || 1}</span>
                    {canEdit && (
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation();
                          handleUpdateQuantity(card, 1); 
                        }}
                        className="w-5 h-5 hover:text-emerald-400 transition-colors flex items-center justify-center bg-white/5 hover:bg-white/10 rounded flex-shrink-0"
                      >
                        <i className="fas fa-plus text-[7px]"></i>
                      </button>
                    )}
                  </div>

                  {canEdit && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                      <button 
                        onClick={() => handleRemoveCard(card)}
                        className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      >
                        <i className="fas fa-trash-can"></i>
                      </button>
                    </div>
                  )}
                </div>
                <div className="px-1">
                  <h4 className="text-xs font-bold text-white truncate leading-tight mb-1">{card.name}</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{card.rarity || 'Common'}</p>
                    <p className="text-[9px] text-purple-400 font-mono font-bold">#{card.id || card.code || 'ID'}</p>
                  </div>
                  <div className="mt-1">
                    <p className="text-[8px] text-slate-600 uppercase font-black truncate">{card.set || card.game || ''}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-slate-700 mx-auto">
                <i className="fas fa-box-open text-3xl"></i>
              </div>
              <div className="space-y-1">
                 <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nada por aqui</p>
                 <p className="text-slate-600 text-sm">Esta pasta está vazia. Adicione cartas de sua busca ou coleção.</p>
              </div>
              <Link to="/busca" className="inline-block bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all mt-4">
                Buscar Cartas
              </Link>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
