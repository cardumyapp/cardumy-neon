import { supabase } from '../lib/supabase';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache: Record<string, { data: any; timestamp: number }> = {};

const getFromCache = (key: string) => {
    const entry = cache[key];
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data;
    }
    return null;
};

const setToCache = (key: string, data: any) => {
    cache[key] = { data, timestamp: Date.now() };
};

export const clearCache = (key?: string) => {
    if (key) {
        delete cache[key];
    } else {
        Object.keys(cache).forEach(k => delete cache[k]);
    }
};

export const getProducts = (callback: (products: any[]) => void) => {
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *, 
        cardgames:cardgames!products_game_id_fkey(id, name), 
        product_types:product_types!fk_products_type(id, name),
        tournament_tickets:tournament_tickets!fk_tickets_product(max_quantity, sold_quantity),
        store_stock:store_stock!fk_stock_product(quantity, store_price, store:stores!fk_store_stock_store(id, name, logo, slug, parceiro))
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    const mappedData = (data || []).map(p => ({
      ...p,
      game_name: p.cardgames?.name || (Array.isArray(p.cardgames) ? p.cardgames[0]?.name : 'TCG'),
      product_type_name: p.product_types?.name || (Array.isArray(p.product_types) ? p.product_types[0]?.name : 'Produto')
    }));

    callback(mappedData);
  };

  fetchProducts();

  // Set up real-time subscription with a unique channel name to avoid conflicts
  const channelName = `public:products:${Math.random().toString(36).substring(2)}`;
  const subscription = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

export const getPrimaryAddress = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const profile = await getUserByAuthId(session.user.id);
    if (!profile) return null;

    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_primary', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching primary address:', error);
    return null;
  }
};

export const getStores = (callback: (stores: any[]) => void) => {
  const cached = getFromCache('stores');
  if (cached) {
    callback(cached);
  }

  const fetchStores = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching stores:', error);
      return;
    }
    setToCache('stores', data || []);
    callback(data || []);
  };

  fetchStores();

  const channelName = `public:stores:${Math.random().toString(36).substring(2)}`;
  const subscription = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, fetchStores)
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

export const syncCard = async (card: any) => {
  try {
    const cardCode = card.code || card.number || card.id?.toString();
    if (!cardCode) {
      console.warn('syncCard: No card identifier found', card);
      return null;
    }
    
    // 1. Check if card exists
    const { data: existing, error: findError } = await supabase
      .from('cards')
      .select('*')
      .eq('external_id', cardCode)
      .maybeSingle();
    
    if (existing) return existing;
    if (findError) {
      console.error('Error finding card during sync:', findError);
      // If it's a connection error, we might want to throw, but for now we follow old logic
    }

    // 2. If not exists, insert it
    const { data: inserted, error: insertError } = await supabase
      .from('cards')
      .insert({
        name: card.name || 'Unknown Card',
        external_id: cardCode,
        game_id: card.game_id || card.gameId || 1,
        image_url: card.imageUrl || card.image_url || card.image
      })
      .select()
      .maybeSingle();

    if (insertError) {
      // Handle race condition: if another user inserted the same card between our check and insert
      if (insertError.code === '23505') {
        const { data: retryData } = await supabase
          .from('cards')
          .select('*')
          .eq('external_id', cardCode)
          .maybeSingle();
        if (retryData) return retryData;
      }
      throw insertError;
    }
    return inserted;
  } catch (error) {
    console.error('Error in syncCard:', error);
    // Instead of null, let's propagate the error if it's meaningful
    throw error;
  }
};

export const addCardToList = async (userId: any, listType: 'cards' | 'wishlist' | 'offerlist', card: any, quantity: number = 1) => {
  const table = listType === 'cards' ? 'user_cards' : listType;
  
  try {
    // 0. Ensure card exists in our DB and get its BIGINT id and game_id
    let dbCardId = card.id;
    let dbGameId = card.game_id;
    
    // If it's not a numeric ID, it's definitely an external ID that needs syncing
    if (isNaN(Number(card.id)) || !dbGameId) {
       try {
         const dbCard = await syncCard(card);
         if (!dbCard) throw new Error('Could not sync card (null returned)');
         dbCardId = dbCard.id;
         dbGameId = dbCard.game_id;
       } catch (err: any) {
         console.error('Critical sync failure:', err);
         throw new Error(`Erro ao sincronizar carta: ${err.message || 'Erro desconhecido'}`);
       }
    }

    if (!dbCardId) throw new Error('Invalid Card ID after sync');

    // Check if card already exists in list
    const { data: existing, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .eq('card_id', dbCardId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    // 2. Insert into destination list
    if (existing) {
      const { error: updateError } = await supabase
        .from(table)
        .update({ quantidade: existing.quantidade + quantity })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      const insertPayload: any = {
        user_id: userId,
        card_id: dbCardId,
        quantidade: quantity,
        game_id: dbGameId
      };
      
      // Some tables might have slightly different structures, user_cards has raridade
      if (table === 'user_cards' && card.rarity) {
        insertPayload.raridade = card.rarity;
      }

      const { error: insertError } = await supabase
        .from(table)
        .insert(insertPayload);
      if (insertError) throw insertError;
    }

    // Log action
    await supabase.from('action_logs').insert({
      user_id: userId,
      action: 'adicionou',
      entity: 'a carta',
      entity_id: String(dbCardId),
      details: { destino: listType, name: card.name, quantidade: quantity }
    });

  } catch (error: any) {
    console.error(`Error adding card to ${listType}:`, error);
    throw error;
  }
};

export const getListCards = (userId: string | number, listType: 'cards' | 'wishlist' | 'offerlist', callback: (cards: any[]) => void) => {
  const table = listType === 'cards' ? 'user_cards' : listType;

  const fetchList = async () => {
    const { data, error } = await supabase
      .from(table)
      .select(`
        *,
        card:cards (
          *,
          cardgame:cardgames!cards_game_id_fkey (name)
        )
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error(`Error fetching ${listType}:`, error);
      return;
    }

    // Flatten card data for backwards compatibility in UI
    const formattedData = (data || []).map(item => {
      const cardInfo = item.card;
      return {
        ...item,
        name: cardInfo?.name,
        image_url: cardInfo?.image_url,
        game: cardInfo?.cardgame?.name || 'Unknown'
      };
    });

    callback(formattedData);
  };

  fetchList();

  const channelName = `public:${table}:${userId}:${Math.random().toString(36).substring(2)}`;
  const subscription = supabase
    .channel(channelName)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: table,
      filter: `user_id=eq.${userId}`
    }, fetchList)
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

export const createBinder = async (userId: string | number, name: string, gameId: string, gameName: string) => {
  try {
    const { data, error } = await supabase
      .from('user_binders')
      .insert({
        user_id: userId,
        name,
        game_id: gameId
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data?.id;
  } catch (error) {
    console.error('Error creating binder:', error);
    throw error;
  }
};

export const getBinders = (userId: string | number, callback: (binders: any[]) => void) => {
    const fetchBinders = async () => {
    // If userId is UUID (from auth), we need the internal ID
    let internalId = userId;
    if (typeof userId === 'string' && userId.length > 30) {
      const { data: user } = await supabase.from('users').select('id').eq('auth_id', userId).maybeSingle();
      if (user) internalId = user.id;
    }

    const { data, error } = await supabase
      .from('user_binders')
      .select('*')
      .eq('user_id', internalId);
    
    if (error) {
      console.error('Error fetching binders:', error);
      return;
    }
    callback(data || []);
  };

  fetchBinders();

  const channelName = `public:user_binders:${userId}:${Math.random().toString(36).substring(2)}`;
  const subscription = supabase
    .channel(channelName)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'user_binders',
      filter: `user_id=eq.${typeof userId === 'string' && userId.length > 30 ? '0' : userId}` // This filter might not work with UUID if the column is bigint
    }, fetchBinders)
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

export const addCardToBinder = async (userId: any, binderId: any, card: any) => {
  try {
    // 1. Ensure we have the base card ID (BIGINT)
    let dbCardId = card.id;
    let dbGameId = card.game_id || card.gameId;

    if (isNaN(Number(card.id))) {
      try {
        const synced = await syncCard(card);
        if (!synced) throw new Error('Sync returned null');
        dbCardId = synced.id;
        dbGameId = synced.game_id;
      } catch (err: any) {
        throw new Error(`Falha ao sincronizar carta com o servidor: ${err.message}`);
      }
    }

    // 2. Check if the card is already in the user's principal collection (user_cards)
    let { data: userCard, error: userCardError } = await supabase
      .from('user_cards')
      .select('id')
      .eq('user_id', userId)
      .eq('card_id', dbCardId)
      .maybeSingle();
    
    if (userCardError) throw userCardError;

    if (!userCard) {
      // Processo automático: Adiciona primeiro à coleção principal
      const { data: newUserCard, error: insertUserCardError } = await supabase
        .from('user_cards')
        .insert({
          user_id: userId,
          card_id: dbCardId,
          quantidade: 1,
          game_id: dbGameId || 1,
          raridade: card.rarity || 'Common'
        })
        .select('id')
        .maybeSingle();
      
      if (insertUserCardError) throw insertUserCardError;
      userCard = newUserCard;

      // Log automatic addition
      await supabase.from('action_logs').insert({
        user_id: userId,
        action: 'adicionou',
        entity: 'a carta (automático via pasta)',
        entity_id: String(dbCardId),
        details: { destino: 'user_cards', name: card.name, quantidade: 1 }
      });
    }

    if (!userCard) throw new Error('Erro ao vincular carta à coleção principal.');

    // 3. Add the link in binder_cards using user_card_id
    const { error: insertError } = await supabase
      .from('binder_cards')
      .insert({
        binder_id: binderId,
        user_card_id: userCard.id
      });
    
    if (insertError) {
      if (insertError.code === '23505') {
        // Idempotent success: if already in binder, we just stop quietly or return a status
        console.info('Card already in binder:', userCard.id);
        return { success: true, alreadyExists: true };
      }
      throw insertError;
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error adding card to binder:', error);
    throw error;
  }
};

export const updateCardQuantityInList = async (userId: string | number, listType: 'cards' | 'wishlist' | 'offerlist', cardId: string, quantity: number) => {
  const table = listType === 'cards' ? 'user_cards' : listType;
  try {
    const { error } = await supabase
      .from(table)
      .update({ quantidade: quantity })
      .eq('user_id', userId)
      .eq('card_id', cardId);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Error updating card quantity in ${listType}:`, error);
    throw error;
  }
};

export const updateCardQuantityInBinder = async (dbId: any, quantity: number) => {
  try {
    const { error } = await supabase
      .from('user_cards')
      .update({ quantidade: quantity })
      .eq('id', dbId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating card quantity in binder:', error);
    throw error;
  }
};

export const removeCardFromList = async (userId: string | number, listType: 'cards' | 'wishlist' | 'offerlist', cardId: string) => {
  const table = listType === 'cards' ? 'user_cards' : listType;
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Error removing card from ${listType}:`, error);
    throw error;
  }
};

export const moveCardBetweenLists = async (userId: string | number, fromList: 'cards' | 'wishlist' | 'offerlist', toList: 'cards' | 'wishlist' | 'offerlist', cardId: string) => {
  const fromTable = fromList === 'cards' ? 'user_cards' : fromList;
  const toTable = toList === 'cards' ? 'user_cards' : toList;
  
  try {
    // 1. Fetch card data from source list
    const { data: cardData, error: fetchError } = await supabase
      .from(fromTable)
      .select('*')
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    if (!cardData) throw new Error('Card not found in source list');

    // 2. Insert into destination list (using upsert logic similar to addCardToList)
    const { data: existing, error: checkError } = await supabase
      .from(toTable)
      .select('*')
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existing) {
      await supabase
        .from(toTable)
        .update({ quantidade: existing.quantidade + cardData.quantidade })
        .eq('id', existing.id);
    } else {
      await supabase
        .from(toTable)
        .insert({
          user_id: userId,
          card_id: cardId,
          quantidade: cardData.quantidade
        });
    }

    // 3. Delete from source list
    await supabase
      .from(fromTable)
      .delete()
      .eq('id', cardData.id);

  } catch (error) {
    console.error(`Error moving card from ${fromList} to ${toList}:`, error);
    throw error;
  }
};

export const deleteBinder = async (userId: string | number, binderId: string | number) => {
  try {
    // 1. Delete associations in binder_cards first
    const { error: relError } = await supabase
      .from('binder_cards')
      .delete()
      .eq('binder_id', binderId);
    
    if (relError) throw relError;

    // 2. Delete the binder itself
    const { error: binderError } = await supabase
      .from('user_binders')
      .delete()
      .eq('id', binderId)
      .eq('user_id', userId);
    
    if (binderError) throw binderError;
  } catch (error) {
    console.error('Error deleting binder:', error);
    throw error;
  }
};

export const getBinderWithCards = async (userId: string | number, binderId: string | number) => {
  try {
    // Fetch binder info first
    const { data: binder, error: binderError } = await supabase
      .from('user_binders')
      .select(`
        id, 
        name, 
        game_id,
        cardgames!user_binders_game_id_fkey (name)
      `)
      .eq('id', binderId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (binderError) throw binderError;
    if (!binder) return null;

    // Fetch cards linked to this binder
    const { data: cards, error: cardsError } = await supabase
      .from('binder_cards')
      .select(`
        card:user_cards (
          *,
          card_info:cards (
             *,
             cardgame:cardgames!cards_game_id_fkey (name)
          )
        )
      `)
      .eq('binder_id', binderId);
    
    if (cardsError) throw cardsError;

    const gameName = Array.isArray(binder.cardgames) 
      ? (binder.cardgames as any)[0]?.name 
      : (binder.cardgames as any)?.name;

    const formattedCards = (cards || []).map(c => {
      const item = c.card;
      const info = (item as any)?.card_info;
      return {
        ...item,
        name: info?.beauty_name || info?.name,
        image_url: info?.image_url,
        game: info?.cardgame?.name || 'Unknown'
      };
    });

    return {
      ...binder,
      game_name: gameName,
      cards: formattedCards
    };
  } catch (error) {
    console.error('Error fetching binder with cards:', error);
    return null;
  }
};

export const removeCardFromBinder = async (binderId: string | number, cardId: string | number) => {
  try {
    const { error } = await supabase
      .from('binder_cards')
      .delete()
      .eq('binder_id', binderId)
      .eq('user_card_id', cardId); // This cardId refers to the ID in user_cards
    
    if (error) throw error;
  } catch (error) {
    console.error('Error removing card from binder:', error);
    throw error;
  }
};

export const getMyStore = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const profile = await getUserByAuthId(session.user.id);
        if (!profile) return null;
        
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching my store:', error);
        return null;
    }
};

export const updateStoreInfo = async (storeId: any, updates: any) => {
    try {
        const { error } = await supabase
          .from('stores')
          .update(updates)
          .eq('id', storeId);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating store info:', error);
        return false;
    }
};

export const addStoreSchedule = async (params: any) => {
    try {
        const { error } = await supabase
          .from('store_schedule')
          .insert(params);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error adding store schedule:', error);
        return false;
    }
};

export const updateTournamentPoints = async (entryId: number, points: number) => {
    try {
        const { error } = await supabase
          .from('tournament_entries')
          .update({ points })
          .eq('id', entryId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating tournament points:', error);
        return false;
    }
};

export const getRankings = async (limit: number = 5) => {
  try {
    const { data: topCollectors, error: collectorsError } = await supabase
      .rpc('get_top_user_cards_with_profile', { p_limit: limit });
    
    const { data: topTraders, error: tradersError } = await supabase
      .rpc('get_top_offerlist_users_with_profile', { p_limit: limit });

    if (collectorsError) throw collectorsError;
    if (tradersError) throw tradersError;

    return {
      topCollectors: topCollectors || [],
      topTraders: topTraders || []
    };
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return { topCollectors: [], topTraders: [] };
  }
};

export const getGlobalStats = async () => {
  const cached = getFromCache('global_stats');
  if (cached) return cached;

  const stats = {
    users: 0,
    stores: 0,
    products: 0,
    tournaments: 0,
    orders: 0
  };

  try {
    const [
      { count: usersCount },
      { count: storesCount },
      { count: productsCount },
      { count: tournamentsCount },
      { count: ordersCount }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('stores').select('*', { count: 'exact', head: true }),
      supabase.from('cards').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true })
    ]);

    stats.users = usersCount || 0;
    stats.stores = storesCount || 0;
    stats.products = productsCount || 0;
    stats.tournaments = tournamentsCount || 0;
    stats.orders = ordersCount || 0;
  } catch (e) { 
    console.warn('Error fetching global stats:', e);
  }

  setToCache('global_stats', stats);
  return stats;
};

export const getNotifications = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return [];

        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', session.user.id)
          .maybeSingle();
        
        if (!profile) return [];

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

export const markNotificationAsRead = async (id: number | string) => {
    try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
          
        return !error;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
};

export const markAllNotificationsAsRead = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return false;

        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', session.user.id)
          .maybeSingle();

        if (!profile) return false;

        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', profile.id)
          .eq('is_read', false);
          
        return !error;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
    }
};

export const getUserProfile = async (userId: string | number) => {
  try {
    // Determine if we should search by ID, Email, or Username
    const isNumeric = !isNaN(Number(userId)) && !String(userId).includes('@') && !String(userId).includes('-');
    
    let query = supabase.from('safe_users').select('*');
    
    if (isNumeric) {
      const { data, error } = await query
        .eq('id', userId)
        .limit(1);
      
      if (data && data.length > 0) {
        const u = data[0];
        return { ...u, role: (u.role as any)?.name || 'user' };
      }
      if (error) throw error;
    }

    // Try finding by email
    if (String(userId).includes('@')) {
      const { data, error } = await query
        .eq('email', userId)
        .limit(1);
      
      if (data && data.length > 0) {
        const u = data[0];
        return { ...u, role: (u.role as any)?.name || 'user' };
      }
      if (error) throw error;
    }

    // Try finding by auth_id (UUID)
    if (String(userId).length > 30) {
      const { data, error } = await query
        .eq('auth_id', userId)
        .limit(1);
      
      if (data && data.length > 0) {
        const u = data[0];
        return { ...u, role: (u.role as any)?.name || 'user' };
      }
      if (error) throw error;
    }

    // Finally try finding by username
    const { data, error } = await query
      .eq('username', userId)
      .limit(1);
    
    if (error) throw error;
    
    const user = (data && data.length > 0) ? data[0] : null;
    if (user) {
      return { ...user, role: (user.role as any)?.name || 'user' };
    }
    
    console.warn(`User profile not found for identifier: ${userId}`);
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const getUserByAuthId = async (authId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, role:roles(name)')
      .eq('auth_id', authId)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      return { ...data, role: (data.role as any)?.name || 'user' };
    }
    return data;
  } catch (error) {
    console.error('Error in getUserByAuthId:', error);
    return null;
  }
};

const getAuthHeaders = async (contentType = 'application/json') => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: any = {
        'Content-Type': contentType
    };
    
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Dev impersonation support
    const impersonated = localStorage.getItem('cardumy_impersonated_user');
    if (impersonated) {
        const user = JSON.parse(impersonated);
        headers['X-Impersonate-User-Id'] = user.id;
    }

    return headers;
};

export const getUserOrders = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return [];

        const profile = await getUserByAuthId(session.user.id);
        if (!profile) return [];

        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, product:products(*)), store:stores(*)')
          .eq('buyer_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error in getUserOrders:', error);
        return [];
    }
};

export const getReceivedOrders = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return [];

        const profile = await getUserByAuthId(session.user.id);
        if (!profile) return [];

        // First find store ID owned by this user
        const { data: store } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (!store) return [];

        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, product:products(*)), buyer:users!buyer_id(*)')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error in getReceivedOrders:', error);
        return [];
    }
};

export const getOrderDetails = async (orderId: string) => {
    try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, product:products(*)), store:stores!fk_orders_store(*), buyer:users!fk_order_buyer(*), shipping_method:shipping_methods!fk_order_shipping_method(*), address:user_addresses!fk_order_address(*)')
          .eq('id', orderId)
          .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error in getOrderDetails:', error);
        return null;
    }
};

export const updateOrderStatus = async (orderId: string, status: string) => {
    try {
        const { error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', orderId);

        if (error) throw error;
        return { ok: true };
    } catch (error) {
        console.error('Error in updateOrderStatus:', error);
        return null;
    }
};

export const cleanupExpiredOrders = async () => {
    try {
        // Find orders pending for more than 2 hours
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        
        const { data: expiredOrders, error: fetchError } = await supabase
          .from('orders')
          .select('id')
          .eq('status', 'pending')
          .lt('created_at', twoHoursAgo);

        if (fetchError) throw fetchError;

        if (expiredOrders && expiredOrders.length > 0) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'expired' })
            .in('id', expiredOrders.map(o => o.id));
          
          if (updateError) throw updateError;
        }

        return { ok: true, count: expiredOrders?.length || 0 };
    } catch (error) {
        console.error('Error in cleanupExpiredOrders:', error);
        return { ok: false };
    }
};

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, stores(logo)')
      .order('codename', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(u => ({
      ...u,
      store_logo: u.stores?.[0]?.logo || u.stores?.logo
    }));
  } catch (error) {
    console.error('Error fetching all users from DB:', error);
    return [];
  }
};

export const getRandomUser = async () => {
  try {
    // Attempt to get a random user from the database
    // We fetch a larger pool and pick one to avoid complex random SQL logic in client
    const { data, error } = await supabase
      .from('users')
      .select('*, stores(logo)')
      .limit(20);
    
    if (error) throw error;
    if (data && data.length > 0) {
      const u = data[Math.floor(Math.random() * data.length)];
      return {
        ...u,
        store_logo: u.stores?.[0]?.logo || u.stores?.logo
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching random user from DB:', error);
    return null;
  }
};

export const syncUser = async (userData: any) => {
  // Now handled by devAutoLogin or directly after standard login.
  // We keep the export to avoid breaking imports but it does nothing.
  return { success: true };
};

export const updateUserProfile = async (userId: string | number, updates: any) => {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq(typeof userId === 'string' && userId.length > 30 ? 'auth_id' : 'id', userId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating profile with Supabase directly:', error);
    return null;
  }
};

export const getStoreBySlug = async (slug: string) => {
  try {
    const isNumeric = !isNaN(Number(slug));
    let query = supabase.from('stores').select('*');
    
    if (isNumeric) {
      query = query.or(`slug.eq."${slug}",id.eq.${slug}`);
    } else {
      query = query.eq('slug', slug);
    }
    
    const { data, error } = await query.limit(1);
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching store by slug:', error);
    return null;
  }
};

export const getStoreProfileInfo = async (username: string) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, stores(*)')
      .eq('username', username)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) return null;

    return {
      user: user,
      store: Array.isArray(user.stores) ? user.stores[0] : user.stores
    };
  } catch (error) {
    console.error('Error fetching store profile info:', error);
    return null;
  }
};

export const getStoreSchedule = async (storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('store_schedule')
      .select('*, cardgames!fk_store_schedule_game(name)')
      .eq('store_id', storeId);
    
    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      game_name: item.cardgames?.name || item.jogo
    }));
  } catch (error) {
    console.error('Error fetching store schedule:', error);
    return [];
  }
};

export const getStoreHours = async (storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('store_hours')
      .select('*')
      .eq('store_id', storeId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching store hours:', error);
    return [];
  }
};

export const updateStoreStock = async (store_id: string | number, product_id: number | string, quantity: number, price?: number, pre_sale?: boolean) => {
  try {
    const { data, error } = await supabase
      .from('store_stock')
      .upsert({
        store_id,
        product_id,
        quantity,
        store_price: price,
        pre_sale
      }, { onConflict: 'store_id,product_id' })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating store stock:', error);
    return { error: error.message };
  }
};

export const getStoreEvents = async (storeId: string) => {
  try {
    const { data: store } = await supabase
      .from('stores')
      .select('user_id')
      .eq('id', storeId)
      .maybeSingle();

    if (!store) return [];

    const { data, error } = await supabase
      .from('tournaments')
      .select('*, cardgames:cardgames!tournaments_cardgame_id_fkey(name)')
      .eq('created_by', store.user_id);
    
    if (error) {
      console.error('Error fetching store tournaments:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching store events:', error);
    return [];
  }
};

export const getActivities = async (limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('action_logs')
      .select('*, user:safe_users(id, username, fullname, avatar)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    // Flatten and safe-guard the data
    return (data || []).map(log => ({
      ...log,
      user_display_name: log.user?.fullname || log.user?.username || log.username || 'Usuário',
      user_avatar: log.user?.avatar || log.avatar,
      user_id_safe: log.user?.id || log.user_id
    }));
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return [];
  }
};

export const getAllTournaments = async () => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        cardgames:cardgames!tournaments_cardgame_id_fkey(name),
        tournament_formats:tournament_formats!tournaments_format_id_fkey(name),
        creator:users!tournaments_created_by_fkey(id, username, codename, avatar),
        tickets:tournament_tickets!fk_tickets_tournament(
          *,
          product:products!fk_tickets_product(*)
        )
      `)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching tournaments:', error);
    return [];
  }
};

export const getCards = async (game?: string): Promise<any[]> => {
  try {
    let query = supabase.from('products').select('*, cardgames(name)').limit(100);
    
    if (game && game !== 'All') {
      const { data: g } = await supabase.from('cardgames').select('id').eq('name', game).maybeSingle();
      if (g) query = query.eq('card_game_id', g.id);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map((p: any) => ({
      id: p.id.toString(),
      name: p.beauty_name || p.name,
      game: p.cardgames?.name || 'Unknown',
      code: p.slug || p.id.toString(),
      rarity: p.product_type || 'Common',
      price: p.msrp || p.mspr || 0,
      imageUrl: p.image_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400',
      set: p.cardgames?.name || 'Base Set'
    }));
  } catch (error) {
    console.error('Error fetching cards:', error);
    return [];
  }
};

export const getGameIcon = (gameName: string) => {
  const name = gameName.toLowerCase();
  if (name.includes('one piece')) return 'fa-anchor';
  if (name.includes('digimon')) return 'fa-dragon';
  if (name.includes('pokémon') || name.includes('pokemon')) return 'fa-bolt';
  if (name.includes('magic')) return 'fa-wand-sparkles';
  if (name.includes('yu-gi-oh') || name.includes('yugioh')) return 'fa-cards';
  if (name.includes('dragon ball')) return 'fa-circle-dot';
  if (name.includes('gundam')) return 'fa-robot';
  if (name.includes('lorcana')) return 'fa-wand-magic-sparkles';
  if (name.includes('union arena')) return 'fa-shield-halved';
  if (name.includes('star wars')) return 'fa-jedi';
  if (name.includes('vanguard')) return 'fa-sword';
  if (name.includes('flesh and blood') || name.includes('fab')) return 'fa-khanda';
  if (name.includes('sorcery')) return 'fa-scroll';
  if (name.includes('riftbound')) return 'fa-fire-pulse';
  return 'fa-gamepad';
};

export const getCardgames = async () => {
  const cached = getFromCache('cardgames');
  if (cached) return cached;
  
  try {
    const { data, error } = await supabase
      .from('cardgames')
      .select('id, name, slug')
      .order('name', { ascending: true });
    
    if (error) throw error;
    setToCache('cardgames', data || []);
    return data || [];
  } catch (error) {
    console.error('Error fetching cardgames:', error);
    return [];
  }
};

export const getTournamentFormats = async () => {
  const cached = getFromCache('tournament_formats');
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('tournament_formats')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    setToCache('tournament_formats', data || []);
    return data || [];
  } catch (error) {
    console.error('Error fetching tournament formats:', error);
    return [];
  }
};

export const getMyTournaments = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const profile = await getUserByAuthId(session.user.id);
    if (!profile) return [];

    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        cardgames:cardgames!tournaments_cardgame_id_fkey(name),
        tournament_formats:tournament_formats!tournaments_format_id_fkey(name),
        tickets:tournament_tickets!fk_tickets_tournament(*, product:products!fk_tickets_product(*))
      `)
      .eq('created_by', profile.id);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching my tournaments:', error);
    return [];
  }
};

export const createTournament = async (tournamentData: any) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Sessão expirada');

    const profile = await getUserByAuthId(session.user.id);
    if (!profile) throw new Error('Perfil não encontrado');

    // 1. Create Tournament (removing columns missing from updated schema)
    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .insert({
        name: tournamentData.name,
        start_date: tournamentData.start_date,
        max_players: Number(tournamentData.max_players) || 32,
        cardgame_id: Number(tournamentData.cardgame_id),
        format_id: Number(tournamentData.format_id),
        created_by: profile.id,
        status: 'open'
      })
      .select()
      .maybeSingle();

    if (tError) throw tError;

    // 2. Create Ticket Product if price > 0
    if (tournamentData.ticket_price > 0 && tournament) {
      // Find store ID owned by this user to associate the product
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      const { data: product, error: pError } = await supabase
        .from('products')
        .insert({
          name: `Inscrição: ${tournamentData.name}`,
          product_type_id: 3, // Assuming 3 is tickets
          game_id: Number(tournamentData.cardgame_id),
          mspr: tournamentData.ticket_price,
          image_url: tournamentData.image_url,
          description: tournamentData.description,
          store_id: store?.id
        })
        .select()
        .maybeSingle();

      if (!pError && product) {
        await supabase
          .from('tournament_tickets')
          .insert({
            tournament_id: tournament.id,
            product_id: product.id,
            max_quantity: Number(tournamentData.ticket_quantity) || tournament.max_players,
            sold_quantity: 0
          });
      }
    }

    return tournament;
  } catch (error: any) {
    console.error('Error creating tournament:', error);
    return { error: error.message || 'Failed to create tournament' };
  }
};

export const checkout = async (items: any[], addressId?: string | number) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Usuário não autenticado');

    const profile = await getUserByAuthId(session.user.id);
    if (!profile) throw new Error('Perfil não encontrado');

    // Group items by store
    const itemsByStore: Record<number, any[]> = {};
    items.forEach(item => {
      const sid = item.storeId || item.store_id;
      if (!itemsByStore[sid]) itemsByStore[sid] = [];
      itemsByStore[sid].push(item);
    });

    const ordersCreated = [];

    for (const storeId in itemsByStore) {
      const storeItems = itemsByStore[storeId];
      const totalAmount = storeItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: profile.id,
          store_id: Number(storeId),
          shipping_address_id: addressId ? Number(addressId) : null,
          products_total: totalAmount,
          amount: totalAmount,
          status: 'pending'
        })
        .select()
        .maybeSingle();

      if (orderError) throw orderError;
      if (!order) throw new Error('Falha ao criar pedido');

      const orderItems = storeItems.map(i => ({
        order_id: order.id,
        product_id: i.id,
        quantity: i.quantity,
        price: i.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
      ordersCreated.push(order);
    }

    return { orders: ordersCreated, success: true };
  } catch (error: any) {
    console.error('Error during checkout:', error);
    throw error;
  }
};

export const getAddresses = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return [];

        const profile = await getUserByAuthId(session.user.id);
        if (!profile) return [];

        const { data, error } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('user_id', profile.id);
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching addresses:', error);
        return [];
    }
};

export const createAddress = async (address: { street: string, city: string, state: string, cep: string, is_default?: boolean }) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('Not authenticated');

        const profile = await getUserByAuthId(session.user.id);
        if (!profile) throw new Error('Profile not found');

        // If this is set as default, unset others first
        if (address.is_default) {
            await supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', profile.id);
        }

        const { data, error } = await supabase
            .from('user_addresses')
            .insert({
                ...address,
                user_id: profile.id
            })
            .select()
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating address:', error);
        throw error;
    }
};

export const updateAddress = async (addressId: number, address: { street?: string, city?: string, state?: string, cep?: string, is_default?: boolean }) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('Not authenticated');

        const profile = await getUserByAuthId(session.user.id);
        if (!profile) throw new Error('Profile not found');

        if (address.is_default) {
            await supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', profile.id)
                .neq('id', addressId);
        }

        const { data, error } = await supabase
            .from('user_addresses')
            .update(address)
            .eq('id', addressId)
            .eq('user_id', profile.id) // Security check
            .select()
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating address:', error);
        throw error;
    }
};

export const deleteAddress = async (addressId: number) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('Not authenticated');

        const profile = await getUserByAuthId(session.user.id);
        if (!profile) throw new Error('Profile not found');

        const { error } = await supabase
            .from('user_addresses')
            .delete()
            .eq('id', addressId)
            .eq('user_id', profile.id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting address:', error);
        throw error;
    }
};

export const getStoreShippingMethods = async (storeId: string | number) => {
    try {
        const { data, error } = await supabase
            .from('store_shipping_methods')
            .select('*, shipping_methods(*)')
            .eq('store_id', storeId)
            .eq('is_active', true);
            
        if (error) throw error;
        // Flatten the response and calculate correct price/days
        return (data || []).map(item => {
            // Supabase relationship might return an object or a single-item array
            const base = Array.isArray(item.shipping_methods) ? item.shipping_methods[0] : item.shipping_methods;
            const finalBase = base || {};
            
            return {
                ...finalBase,
                ...item,
                id: item.shipping_method_id,
                original_id: item.id,
                name: finalBase.name || item.name || 'Envio',
                price: item.price_override !== null && item.price_override !== undefined ? Number(item.price_override) : Number(finalBase.avg_price || 0),
                estimated_days: item.delivery_days_override !== null && item.delivery_days_override !== undefined ? Number(item.delivery_days_override) : Number(finalBase.delivery_days || 0)
            };
        });
    } catch (error) {
        console.error('Error fetching shipping methods:', error);
        return [];
    }
};

export const getStorePaymentMethods = async (storeId: string | number) => {
    try {
        const { data, error } = await supabase
            .from('store_payment_methods')
            .select('*, payment_methods(*)')
            .eq('store_id', storeId)
            .eq('enabled', true);
            
        if (error) throw error;
        // Flatten the response
        return (data || []).map(item => ({
            ...item.payment_methods,
            ...item,
            id: item.payment_method_id,
            original_id: item.id
        }));
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return [];
    }
};

export const createOrderFull = async (params: {
    store_id: number;
    address_id: number;
    shipping_method_id: number;
    payment_method_id: number | string;
    shipping_cost?: number;
    items: { product_id: number; quantity: number, price: number }[];
}) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('Login necessário');

        const profile = await getUserByAuthId(session.user.id);
        if (!profile) throw new Error('Perfil não encontrado');

        const productsTotal = params.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        const shippingCost = params.shipping_cost || 0;
        const totalAmount = productsTotal + shippingCost;

        const externalRef = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                external_reference: externalRef,
                buyer_id: profile.id,
                store_id: params.store_id,
                shipping_address_id: params.address_id,
                shipping_method_id: params.shipping_method_id,
                payment_method_id: Number(params.payment_method_id),
                products_total: productsTotal,
                shipping_price: shippingCost,
                amount: totalAmount,
                status: 'pending'
            })
            .select()
            .maybeSingle();

        if (orderError) throw orderError;
        if (!order) throw new Error('Erro ao criar pedido');

        const orderItems = params.items.map(i => ({
            order_id: order.id,
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;
        return order;
    } catch (error: any) {
        console.error('Error in createOrderFull:', error);
        throw error;
    }
};

export const startTournament = async (id: number | string) => {
  try {
    const { error } = await supabase
      .from('tournaments')
      .update({ status: 'running' })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error starting tournament:', error);
    return { error: 'Failed to start tournament' };
  }
};

export const getTournamentEntries = async (id: number | string) => {
  try {
    const { data, error } = await supabase
      .from('tournament_entries')
      .select('*, user:users(*)')
      .eq('tournament_id', id);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching entries:', error);
    return [];
  }
};

export const updateEntryStatus = async (entryId: number | string, status: string) => {
  try {
    const { error } = await supabase
      .from('tournament_entries')
      .update({ status })
      .eq('id', entryId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating entry status:', error);
    return { error: 'Failed to update entry status' };
  }
};

export const finalizeTournament = async (id: number | string, tops: { top1?: string; top2?: string; top3?: string }) => {
  try {
    const { error } = await supabase
      .from('tournaments')
      .update({ 
        status: 'finished',
        winner_id: tops.top1 || null
      })
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error finalizing tournament:', error);
    return { error: 'Failed to finalize tournament' };
  }
};

export const searchExternalCards = async (game: string, query: string, page: number = 1, limit: number = 20): Promise<{ data: any[], total: number, totalPages: number }> => {
  try {
    const cardGames = await getCardgames();
    const gameData = (cardGames as any[]).find((g: any) => g.name.toLowerCase() === game.toLowerCase());
    const gameId = gameData?.id || 1;

    let externalData: any[] = [];
    let total = 0;

    // Search using our internal proxy that points to Homura API
    const params = new URLSearchParams({
      game: game.toLowerCase(),
      name: query,
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await fetch(`/api/cards?${params.toString()}`);
    const result = await response.json();

    const list = Array.isArray(result) ? result : (result.data || []);
    
    if (list.length > 0) {
      externalData = list.map((c: any) => ({
        id: c.id?.toString() || Math.random().toString(),
        name: c.name || c.juSTname || 'Unknown Card',
        game: game,
        game_id: gameId,
        code: c.code || c.number || c.set_code || '',
        rarity: c.rarity || c.set_rarity || (c.product_type === 'single' ? 'Common' : c.product_type) || 'Common',
        price: parseFloat(c.price || (c.variants?.length > 0 ? c.variants[0].price : 0) || 0),
        imageUrl: c.imageUrl || c.image || (c.images && (c.images.small || c.images.large || c.images.png)) || (c.image_uris && (c.image_uris.normal || c.image_uris.small)),
        set: c.set?.name || c.set || c.set_name || '',
        description: c.description || c.oracle_text || c.desc || '',
        variants: c.variants || []
      }));
      total = result.total || result.total_cards || result.totalCount || externalData.length;
    } else {
      // Fallback to local search for other games or if external search fails
      let q = supabase
        .from('cards')
        .select('*, cardgames(name)', { count: 'exact' })
        .ilike('name', `%${query}%`)
        .range((page - 1) * limit, page * limit - 1);

      if (game && game !== 'All') {
        q = q.eq('game_id', gameId);
      }

      const { data, count, error } = await q;
      if (error) throw error;
      
      externalData = (data || []).map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        game: c.cardgames?.name || game,
        game_id: c.game_id,
        code: c.external_id || c.id.toString(),
        rarity: 'Common',
        price: c.price || 0,
        imageUrl: c.image_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400',
        set: c.cardgames?.name || 'Base Set',
        description: '',
        variants: []
      }));
      total = count || 0;
    }

    return {
      data: externalData,
      total: total,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error searching cards:', error);
    return { data: [], total: 0, totalPages: 0 };
  }
};

export const getStoreTournaments = async (username: string) => {
  try {
    const { data: user } = await supabase.from('users').select('id').eq('username', username).maybeSingle();
    if (!user) return [];

    const { data: store } = await supabase.from('stores').select('id, user_id').eq('user_id', user.id).maybeSingle();
    if (!store) return [];

    const { data, error } = await supabase
      .from('tournaments')
      .select('*, cardgames!tournaments_cardgame_id_fkey(name), tournament_formats!tournaments_format_id_fkey(name)')
      .eq('created_by', user.id);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching store tournaments:', error);
    return [];
  }
};

export const getFullUserProfile = async (username: string, followerId?: string) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('safe_users')
      .select('*, stores(*)')
      .eq('username', username)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) return null;

    // Use counts from safe_users view
    const followersCountQuery = supabase.from('user_followers').select('*', { count: 'exact', head: true }).eq('followed_id', user.id);
    const followingCountQuery = supabase.from('user_followers').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);

    const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
      followersCountQuery,
      followingCountQuery
    ]);

    const collection_size = Number(user.collection_size || 0);
    const wishlist_size = Number(user.wishlist_size || 0);
    const offers_size = Number(user.offers_size || 0);
    const likes = Number(user.likes || 0);
    const dislikes = Number(user.dislikes || 0);
    const total_reviews = likes + dislikes;
    const approval_rate = total_reviews > 0 ? Math.round((likes / total_reviews) * 100) : 100;

    let isFollowing = false;
    if (followerId) {
       // ... existing follow check code ...
       const { data: followData } = await supabase.from('user_followers').select('*').eq('followed_id', user.id).eq('follower_id', followerId || '').maybeSingle();
       isFollowing = !!followData;
    }

    return {
      user: {
        ...user,
        codename: user.fullname || user.codename, // Handle codename alias from view
        store_logo: user.stores?.[0]?.logo || user.stores?.logo
      },
      stats: {
        collection_size,
        wishlist_size,
        offers_size,
        followers: followersCount || 0,
        following: followingCount || 0,
        approval_rate,
        total_reviews,
        likes,
        dislikes
      },
      isFollowing
    };
  } catch (error) {
    console.error('Error fetching full user profile:', error);
    return null;
  }
};

export const followUser = async (username: string, followerId: string) => {
  try {
    const { data: user } = await supabase.from('users').select('id').eq('username', username).maybeSingle();
    if (!user) throw new Error('User not found');

    const { error } = await supabase.from('user_followers').insert({
        followed_id: user.id,
        follower_id: followerId
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error following user:', error);
    return null;
  }
};

export const unfollowUser = async (username: string, followerId: string) => {
  try {
    const { data: user } = await supabase.from('users').select('id').eq('username', username).maybeSingle();
    if (!user) throw new Error('User not found');

    const { error } = await supabase.from('user_followers').delete().eq('followed_id', user.id).eq('follower_id', followerId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return null;
  }
};

export const submitUserReview = async (username: string, reviewerId: string, isPositive: boolean, comment: string) => {
  try {
    const { data: user } = await supabase.from('users').select('id').eq('username', username).maybeSingle();
    if (!user) throw new Error('User not found');

    const { error } = await supabase.from('user_reviews').insert({
        reviewed_id: user.id,
        reviewer_id: reviewerId,
        is_positive: isPositive,
        comment
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error submitting review:', error);
    return null;
  }
};

export const getCollectionRanking = async (limit: number = 5) => {
  try {
    const { data, error } = await supabase
      .rpc('get_collection_ranking', { p_limit: limit });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching collection ranking:', error);
    return [];
  }
};

export const getOffersRanking = async (limit: number = 5) => {
  try {
    const { data, error } = await supabase
      .rpc('get_offers_ranking', { p_limit: limit });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching offers ranking:', error);
    return [];
  }
};

export const searchUsers = async (searchTerm: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, codename, avatar, role_id')
      .or(`username.ilike.%${searchTerm}%,codename.ilike.%${searchTerm}%`)
      .limit(10);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

export const getFoldersStats = async (userId: string | number) => {
  try {
    let resolvedUserId = userId;
    if (typeof userId === 'string' && userId.includes('-')) {
        const u = await getUserByAuthId(userId);
        if (u) resolvedUserId = u.id;
    }

    const stats: Record<string, number> = {
      colecao: 0,
      wishlist: 0,
      offerlist: 0
    };

    // System counts (sum of quantidade)
    const { data: collecaoData } = await supabase.from('user_cards').select('quantidade').eq('user_id', resolvedUserId);
    stats.colecao = collecaoData?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;

    const { data: wishlistData } = await supabase.from('wishlist').select('quantidade').eq('user_id', resolvedUserId);
    stats.wishlist = wishlistData?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;

    const { data: offerlistData } = await supabase.from('offerlist').select('quantidade').eq('user_id', resolvedUserId);
    stats.offerlist = offerlistData?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;

    // Binder counts
    const { data: binders } = await supabase.from('user_binders').select('id').eq('user_id', resolvedUserId);
    
    if (binders && binders.length > 0) {
      const binderIds = binders.map(b => b.id);
      const { data: binderCards } = await supabase
        .from('binder_cards')
        .select(`
          binder_id,
          user_cards!user_card_id (
            quantidade
          )
        `)
        .in('binder_id', binderIds);
      
      const binderStatsMap: Record<string, number> = {};
      binderIds.forEach(id => binderStatsMap[id] = 0);

      binderCards?.forEach((bc: any) => {
        if (bc.binder_id && bc.user_cards) {
          binderStatsMap[bc.binder_id] += (bc.user_cards.quantidade || 0);
        }
      });

      return { system: stats, binders: binderStatsMap };
    }

    return { system: stats, binders: {} };
  } catch (error) {
    console.error('Error fetching folder stats:', error);
    return { system: { colecao: 0, wishlist: 0, offerlist: 0 }, binders: {} };
  }
};

export const getFighterTags = async () => {
  try {
    const { data, error } = await supabase.from('fighter_tags').select('*').order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching fighter tags:', error);
    return [];
  }
};

export const getReviewPhrases = async (type?: 'positive' | 'negative') => {
  try {
    let query = supabase.from('review_phrases').select('*');
    if (type) query = query.eq('type', type);
    
    const { data, error } = await query.order('text', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching review phrases:', error);
    return [];
  }
};

export const getProductTypes = async (gameId?: string | number) => {
  const cacheKey = `product_types_${gameId || 'all'}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    let query = supabase.from('product_types').select('*');
    if (gameId && gameId !== 'all') query = query.eq('game_id', gameId);
    
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    setToCache(cacheKey, data || []);
    return data || [];
  } catch (error) {
    console.error('Error fetching product types:', error);
    return [];
  }
};

export const getProductsByFilters = async (filters: { game_id?: string | number, product_type_id?: string | number }) => {
  try {
    let query = supabase.from('products').select('*, cardgames(name), product_types(name)');
    if (filters.game_id && filters.game_id !== 'all') query = query.eq('game_id', filters.game_id);
    if (filters.product_type_id && filters.product_type_id !== 'all') query = query.eq('product_type_id', filters.product_type_id);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching filtered products:', error);
    return [];
  }
};

export const getTournamentDetails = async (id: number | string) => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *, 
        cardgames:cardgames!tournaments_cardgame_id_fkey(name), 
        tournament_formats:tournament_formats!tournaments_format_id_fkey(name),
        creator:users!tournaments_created_by_fkey(id, username, codename, avatar),
        tickets:tournament_tickets!fk_tickets_tournament(
          *,
          product:products!fk_tickets_product(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching tournament details:', error);
    return null;
  }
};
