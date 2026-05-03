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
        cardgames(id, name), 
        product_types(id, name),
        tournament_tickets!fk_tickets_product(max_quantity, sold_quantity),
        store_stock(quantity, store_price, stores(id, name, logo, slug, parceiro))
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    callback(data || []);
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
    // No backend anymore. We do exactly what the backend did but on frontend.
    // Check if card exists by code/external_id logic
    const cardCode = card.code || card.number || card.id;
    
    const { data: existing, error: findError } = await supabase
      .from('cards')
      .select('*')
      .eq('slug', cardCode) // or another unique field
      .maybeSingle();
    
    if (existing) return existing;

    // If not exists, insert it
    const { data: inserted, error: insertError } = await supabase
      .from('cards')
      .insert({
        name: card.name,
        beauty_name: card.name,
        slug: cardCode,
        game_id: card.game_id || 1, // Defaulting to 1 if unknown
        image_url: card.imageUrl || card.image_url,
        product_type: card.product_type || 'single'
      })
      .select()
      .maybeSingle();

    if (insertError) throw insertError;
    return inserted;
  } catch (error) {
    console.error('Error syncing card:', error);
    return null;
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
       const dbCard = await syncCard(card);
       if (!dbCard) throw new Error('Could not sync card to database');
       dbCardId = dbCard.id;
       dbGameId = dbCard.game_id;
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

  } catch (error) {
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
          cardgame:cardgames (name)
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
    if (isNaN(Number(card.id))) {
      const synced = await syncCard(card);
      if (!synced) throw new Error('Falha ao sincronizar carta com o servidor');
      dbCardId = synced.id;
    }

    // 2. Check if the card is already in the user's principal collection (user_cards)
    const { data: userCard, error: userCardError } = await supabase
      .from('user_cards')
      .select('id')
      .eq('user_id', userId)
      .eq('card_id', dbCardId)
      .maybeSingle();
    
    if (userCardError) throw userCardError;
    if (!userCard) {
      throw new Error('Esta carta deve ser adicionada à sua coleção principal primeiro.');
    }

    // 3. Add the link in binder_cards using user_card_id
    const { error: insertError } = await supabase
      .from('binder_cards')
      .insert({
        binder_id: binderId,
        user_card_id: userCard.id
      });
    
    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('Esta carta já está nesta pasta.');
      }
      throw insertError;
    }
  } catch (error) {
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
        cardgames (name)
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
             cardgame:cardgames (name)
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
          .eq('owner_id', profile.id)
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
          .from('store_schedules')
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
    
    if (isNumeric) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .limit(1);
      
      if (data && data.length > 0) return data[0];
      if (error) throw error;
    }

    // Try finding by email
    if (String(userId).includes('@')) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', userId)
        .limit(1);
      
      if (data && data.length > 0) return data[0];
      if (error) throw error;
    }

    // Try finding by auth_id (UUID)
    if (String(userId).length > 30) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .limit(1);
      
      if (data && data.length > 0) return data[0];
      if (error) throw error;
    }

    // Finally try finding by username
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', userId)
      .limit(1);
    
    if (error) throw error;
    
    const user = (data && data.length > 0) ? data[0] : null;
    if (!user) {
      console.warn(`User profile not found for identifier: ${userId}`);
    }
    return user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const getUserByAuthId = async (authId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle();

    if (error) throw error;
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
          .eq('user_id', profile.id)
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
          .eq('owner_id', profile.id)
          .maybeSingle();

        if (!store) return [];

        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, product:products(*)), user:users(*)')
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
          .select('*, order_items(*, product:products(*)), store:stores(*), user:users(*), shipping_method:shipping_methods(*), payment_method:payment_methods(*), address:user_addresses(*)')
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
            .update({ status: 'cancelled' })
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
      .from('store_schedules')
      .select('*')
      .eq('store_id', storeId);
    
    if (error) throw error;
    return data || [];
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
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, max_players, start_date, status, description, image_url')
      .eq('location', storeId);
    
    if (error) {
      // Try fetching by store name if storeId fails? 
      // Actually tournaments usually have a store reference.
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
      .select('*, user:users(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
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
        cardgames(name),
        tournament_formats(name),
        creator:users!created_by(id, username, codename, avatar),
        tickets:tournament_tickets!fk_tickets_tournament(
          *,
          product:products(*)
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
        cardgames(name),
        tournament_formats(name),
        tickets:tournament_tickets!fk_tickets_tournament(*, product:products(*))
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

    // 1. Create Tournament
    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .insert({
        name: tournamentData.name,
        description: tournamentData.description,
        start_date: tournamentData.start_date,
        location: tournamentData.location,
        max_players: Number(tournamentData.max_players) || 32,
        cardgame_id: Number(tournamentData.cardgame_id),
        format_id: Number(tournamentData.format_id),
        created_by: profile.id,
        status: 'open',
        image_url: tournamentData.image_url
      })
      .select()
      .maybeSingle();

    if (tError) throw tError;

    // 2. Create Ticket Product if price > 0
    if (tournamentData.ticket_price > 0 && tournament) {
      const { data: product, error: pError } = await supabase
        .from('products')
        .insert({
          name: `Inscrição: ${tournament.name}`,
          beauty_name: `Ticket - ${tournament.name}`,
          product_type_id: 3, // Assuming 3 is tickets
          card_game_id: tournament.cardgame_id,
          msrp: tournamentData.ticket_price,
          image_url: tournament.image_url
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
          user_id: profile.id,
          store_id: Number(storeId),
          address_id: addressId ? Number(addressId) : null,
          total_amount: totalAmount,
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

export const getStoreShippingMethods = async (storeId: string | number) => {
    try {
        const { data, error } = await supabase
            .from('shipping_methods')
            .select('*')
            .eq('store_id', storeId);
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching shipping methods:', error);
        return [];
    }
};

export const getStorePaymentMethods = async (storeId: string | number) => {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('store_id', storeId);
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return [];
    }
};

export const createOrderFull = async (params: {
    store_id: number;
    address_id: number;
    shipping_method_id: number;
    payment_method_id: number;
    items: { product_id: number; quantity: number, price: number }[];
}) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('Login necessário');

        const totalAmount = params.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: session.user.id,
                store_id: params.store_id,
                address_id: params.address_id,
                shipping_method_id: params.shipping_method_id,
                payment_method_id: params.payment_method_id,
                total_amount: totalAmount,
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
            price: i.price
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
    // Falls back to searching local cards table
    let q = supabase
      .from('cards')
      .select('*, cardgames(name)', { count: 'exact' })
      .ilike('name', `%${query}%`)
      .range((page - 1) * limit, page * limit - 1);

    if (game && game !== 'All') {
      const { data: g } = await supabase.from('cardgames').select('id').eq('name', game).maybeSingle();
      if (g) q = q.eq('game_id', g.id);
    }

    const { data, count, error } = await q;
    if (error) throw error;
    
    const mappedCards = (data || []).map((c: any) => ({
      id: c.id.toString(),
      name: c.beauty_name || c.name,
      game: c.cardgames?.name || game,
      code: c.slug || c.id.toString(),
      rarity: c.product_type || 'Common',
      price: c.price || 0,
      imageUrl: c.image_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400',
      set: c.cardgames?.name || 'Base Set',
      description: '',
      variants: []
    }));

    return {
      data: mappedCards,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
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

    const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).maybeSingle();
    if (!store) return [];

    const { data, error } = await supabase
      .from('tournaments')
      .select('*, cardgames(name), tournament_formats(name)')
      .eq('location', store.id);

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
      .from('users')
      .select('*, stores(*)')
      .eq('username', username)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) return null;

    // Fetch collections counts
    const [{ count: cardsCount }, { count: wishlistCount }, { count: offerlistCount }, { count: followersCount }, { count: followingCount }] = await Promise.all([
      supabase.from('user_cards').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('wishlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('offerlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('user_followers').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('user_followers').select('*', { count: 'exact', head: true }).eq('follower_id', user.id)
    ]);

    let isFollowing = false;
    if (followerId) {
       const { data: followData } = await supabase.from('user_followers').select('*').eq('user_id', user.id).eq('follower_id', followerId).maybeSingle();
       isFollowing = !!followData;
    }

    return {
      user: {
        ...user,
        store_logo: user.stores?.[0]?.logo || user.stores?.logo
      },
      stats: {
        cards: cardsCount || 0,
        wishlist: wishlistCount || 0,
        offerlist: offerlistCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0
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
        user_id: user.id,
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

    const { error } = await supabase.from('user_followers').delete().eq('user_id', user.id).eq('follower_id', followerId);

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
        user_id: user.id,
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
    const stats: Record<string, number> = {
      colecao: 0,
      wishlist: 0,
      offerlist: 0
    };

    // System counts (sum of quantidade)
    const { data: collecaoData } = await supabase.from('user_cards').select('quantidade').eq('user_id', userId);
    stats.colecao = collecaoData?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;

    const { data: wishlistData } = await supabase.from('wishlist').select('quantidade').eq('user_id', userId);
    stats.wishlist = wishlistData?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;

    const { data: offerlistData } = await supabase.from('offerlist').select('quantidade').eq('user_id', userId);
    stats.offerlist = offerlistData?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;

    // Binder counts
    const { data: binders } = await supabase.from('user_binders').select('id').eq('user_id', userId);
    
    if (binders && binders.length > 0) {
      const binderIds = binders.map(b => b.id);
      const { data: binderCards } = await supabase
        .from('binder_cards')
        .select('binder_id, card:user_cards(quantidade)')
        .in('binder_id', binderIds);
      
      const binderStatsMap: Record<string, number> = {};
      binderIds.forEach(id => binderStatsMap[id] = 0);

      binderCards?.forEach((bc: any) => {
        if (bc.binder_id && bc.card) {
          binderStatsMap[bc.binder_id] += (bc.card.quantidade || 0);
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
        cardgames(name), 
        tournament_formats(name),
        creator:users!created_by(id, username, codename, avatar),
        stores!inner(id, name, logo, slug),
        tickets:tournament_tickets!fk_tickets_tournament(
          *,
          product:products(
            *,
            stores(store_id)
          )
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
