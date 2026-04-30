import { supabase } from '../lib/supabase';

export const getProducts = (callback: (products: any[]) => void) => {
  // Test server connectivity on load
  fetch('/api/ping')
    .then(r => r.json())
    .then(d => console.log('[DEBUG] Server ping success:', d))
    .catch(e => console.error('[DEBUG] Server ping FAILED. Server might be down or unreachable via relative path:', e));

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, cardgames(name), product_types(name)')
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
    const token = session?.access_token;
    
    const response = await fetch('/api/user/address/primary', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching primary address:', error);
    return null;
  }
};

export const getStores = (callback: (stores: any[]) => void) => {
  const fetchStores = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching stores:', error);
      return;
    }
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
    const response = await fetch('/api/cards/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card })
    });
    if (!response.ok) throw new Error('Failed to sync card with DB');
    return await response.json();
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
    const { data, error } = await supabase
      .from('user_binders')
      .select('*')
      .eq('user_id', userId);
    
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
      filter: `user_id=eq.${userId}`
    }, fetchBinders)
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

export const addCardToBinder = async (userId: any, binderId: any, card: any) => {
  try {
    // Ensure card is in our DB
    let dbCardId = card.id;
    let dbGameId = card.game_id;
    if (isNaN(Number(card.id)) || !dbGameId) {
      const synced = await syncCard(card);
      if (!synced) throw new Error('Failed to sync card');
      dbCardId = synced.id;
      dbGameId = synced.game_id;
    }

    let cardRecordId;
    const { data: existingCard } = await supabase
      .from('user_cards')
      .select('id')
      .eq('user_id', userId)
      .eq('card_id', dbCardId)
      .maybeSingle();
    
    if (existingCard) {
      cardRecordId = existingCard.id;
    } else {
      const { data: newCard, error: insertError } = await supabase
        .from('user_cards')
        .insert({
          user_id: userId,
          card_id: dbCardId,
          quantidade: 1,
          game_id: dbGameId
        })
        .select()
        .maybeSingle();
      if (insertError) throw insertError;
      cardRecordId = newCard?.id;
    }

    const { error } = await supabase
      .from('binder_cards')
      .insert({
        binder_id: binderId,
        card_id: cardRecordId
      });
    
    if (error) throw error;
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
      .eq('card_id', cardId); // This cardId refers to the ID in user_cards
    
    if (error) throw error;
  } catch (error) {
    console.error('Error removing card from binder:', error);
    throw error;
  }
};

export const getGlobalStats = async () => {
  const stats = {
    users: 0,
    stores: 0,
    products: 0,
    tournaments: 0,
    orders: 0
  };

  try {
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    stats.users = usersCount || 0;
  } catch (e) { console.warn('Table users not found or inaccessible'); }

  try {
    const { count: storesCount } = await supabase.from('stores').select('*', { count: 'exact', head: true });
    stats.stores = storesCount || 0;
  } catch (e) { console.warn('Table stores not found or inaccessible'); }

  try {
    const { count: productsCount } = await supabase.from('cards').select('*', { count: 'exact', head: true });
    stats.products = productsCount || 0;
  } catch (e) { console.warn('Table cards not found or inaccessible'); }

  try {
    const { count: tournamentsCount } = await supabase.from('tournaments').select('*', { count: 'exact', head: true });
    stats.tournaments = tournamentsCount || 0;
  } catch (e) { console.warn('Table tournaments not found or inaccessible'); }

  try {
    const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    stats.orders = ordersCount || 0;
  } catch (e) { console.warn('Table orders not found or inaccessible'); }

  return stats;
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

export const getRandomUser = async () => {
  try {
    // Attempt to get a random user from the database
    // We fetch a larger pool and pick one to avoid complex random SQL logic in client
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(20);
    
    if (error) throw error;
    if (data && data.length > 0) {
      return data[Math.floor(Math.random() * data.length)];
    }
    return null;
  } catch (error) {
    console.error('Error fetching random user from DB:', error);
    return null;
  }
};

export const syncUser = async (userData: any) => {
  try {
    const url = '/api/sync-user';
    console.log(`API Call: syncUser to ${url}`, userData.email);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userData })
    }).catch(err => {
      console.error(`Network error or blocked fetch to ${url}:`, err);
      throw new Error(`Failed to connect to server at ${url}. Possible network or CORS issue.`);
    });
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMsg = 'Failed to sync user';
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } else {
        const text = await response.text();
        console.error('Server returned non-JSON error for sync-user:', text);
        errorMsg = `Server error (${response.status})`;
      }
      throw new Error(errorMsg);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing user with Supabase via backend:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string | number, updates: any) => {
  try {
    const response = await fetch('/api/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, updates })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating profile with Supabase via backend:', error);
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
    console.log('API Call: getStoreProfileInfo', username);
    const response = await fetch(`/api/lojas/${encodeURIComponent(username)}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch store profile info: ${response.status} ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching store profile info (Failed to fetch usually means server is unreachable):', error);
    return null;
  }
};

export const getStoreSchedule = async (storeId: string) => {
  try {
    console.log('API Call: getStoreSchedule (Events)', storeId);
    const response = await fetch(`/api/lojas/${encodeURIComponent(storeId)}/semanais`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch store schedule: ${response.status} ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching store schedule:', error);
    return [];
  }
};

export const getStoreHours = async (storeId: string) => {
  try {
    console.log('API Call: getStoreHours', storeId);
    const response = await fetch(`/api/lojas/${encodeURIComponent(storeId)}/hours`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch store hours: ${response.status} ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching store hours:', error);
    return [];
  }
};

export const updateStoreStock = async (store_id: string | number, product_id: number | string, quantity: number, price?: number, pre_sale?: boolean) => {
  try {
    const response = await fetch('/api/lojas/estoque/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        store_id, 
        product_id, 
        quantity,
        store_price: price,
        pre_sale
      })
    });
    if (!response.ok) throw new Error('Failed to update store stock');
    return await response.json();
  } catch (error) {
    console.error('Error updating store stock:', error);
    return null;
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
    console.log('API Call: getActivities', limit);
    const response = await fetch(`/api/atividades?limit=${limit}`);
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMsg = `Failed to fetch activities: ${response.status}`;
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } else {
        const text = await response.text();
        console.error('Activities fetch non-JSON error:', text);
      }
      throw new Error(errorMsg);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching activities (Failed to fetch usually means server is unreachable):', error?.message || error);
    return [];
  }
};

export const getAllTournaments = async () => {
  try {
    console.log('API Call: getAllTournaments');
    const response = await fetch('/api/torneios');
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMsg = `Failed to fetch tournaments: ${response.status}`;
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } else {
        const text = await response.text();
        console.error('Tournaments fetch non-JSON error:', text);
      }
      throw new Error(errorMsg);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching tournaments (Failed to fetch usually means server is unreachable):', error?.message || error);
    return [];
  }
};

export const getCards = async (game?: string): Promise<any[]> => {
  try {
    let url = '/api/produtos?limit=100';
    if (game && game !== 'All') url += `&game=${encodeURIComponent(game)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch products for cards');
    const data = await response.json();
    
    return (data.produtos || []).map((p: any) => ({
      id: p.id.toString(),
      name: p.beauty_name || p.name,
      game: p.cardgames?.name || 'Unknown',
      code: p.slug || p.id.toString(),
      rarity: p.product_type || 'Common',
      price: p.msrp || 0,
      imageUrl: p.image_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400',
      set: p.cardgames?.name || 'Base Set'
    }));
  } catch (error) {
    console.error('Error fetching cards:', error);
    return [];
  }
};

export const getCardgames = async () => {
  try {
    const { data, error } = await supabase
      .from('cardgames')
      .select('id, name, slug')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching cardgames:', error);
    return [];
  }
};

export const searchExternalCards = async (game: string, query: string, page: number = 1, limit: number = 20): Promise<{ data: any[], total: number, totalPages: number }> => {
  try {
    // Map to API game IDs (standard slugs expected by Homura API)
    const gameMap: Record<string, string> = {
      'One Piece': 'onepiece',
      'Magic': 'magic',
      'Pokémon': 'pokemon',
      'Yu-Gi-Oh!': 'yugioh',
      'Disney Lorcana': 'lorcana',
      'Digimon': 'digimon',
      'Union Arena': 'unionarena',
      'Dragon Ball': 'dragonballfussion'
    };

    const gameId = gameMap[game] || game.toLowerCase().replace(/\s+/g, '');
    const response = await fetch(`/api/cards?game=${encodeURIComponent(gameId)}&q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to fetch external cards. Status:', response.status, 'Body:', errorData);
      throw new Error(`Failed to fetch external cards: ${response.status}`);
    }
    const data = await response.json();
    
    // The API might return directly an array or a structured object
    const list = Array.isArray(data) ? data : (data.data || data.cards || []);
    const total = typeof data.total === 'number' ? data.total : list.length;
    const totalPages = typeof data.totalPages === 'number' ? data.totalPages : 1;
    
    const mappedCards = list.map((c: any) => {
      // Extract a string for the set name
      let setName = 'Desconhecido';
      if (typeof c.set === 'string') {
        setName = c.set;
      } else if (c.set && typeof c.set === 'object') {
        setName = c.set.beauty_name || c.set.name || c.set.set_code || setName;
      } else if (c.set_name) {
        setName = c.set_name;
      }

      const safeString = (val: any, fallback: string = '') => {
        if (typeof val === 'string') return val;
        if (val && typeof val === 'object') return val.name || val.text || val.beauty_name || JSON.stringify(val);
        return fallback;
      };

      return {
        id: c.id || c.code || Math.random().toString(),
        name: safeString(c.name, 'Carta sem nome'),
        game: game,
        code: safeString(c.code || c.number, 'N/A'),
        rarity: safeString(c.rarity, 'Common'),
        price: c.price || 0,
        imageUrl: c.image || c.imageUrl || c.images?.small || c.images?.normal || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400',
        set: setName,
        description: safeString(c.text || c.effect, ''),
        variants: c.variants || []
      };
    });

    return {
      data: mappedCards,
      total,
      totalPages
    };
  } catch (error) {
    console.error('Error searching external cards:', error);
    return { data: [], total: 0, totalPages: 0 };
  }
};

export const getStoreTournaments = async (username: string) => {
  try {
    const response = await fetch(`/api/lojas/${username}/torneios`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Store tournaments fetch error response:', errorText);
      throw new Error(`Failed to fetch store tournaments: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching store tournaments:', error?.message || error);
    return null;
  }
};

export const getFullUserProfile = async (username: string, followerId?: string) => {
  try {
    const url = `/api/users/${encodeURIComponent(String(username))}/profile${followerId ? `?follower_id=${followerId}` : ''}`;
    const response = await fetch(url).catch(err => {
      console.error(`Network error fetching profile from ${url}:`, err);
      throw err;
    });
    
    if (!response.ok) {
      console.error(`Profile fetch error: ${response.status} for ${url}`);
      throw new Error('Failed to fetch full user profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching full user profile:', error);
    return null;
  }
};

export const followUser = async (username: string, followerId: string) => {
  try {
    const response = await fetch(`/api/users/${username}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower_id: followerId })
    });
    if (!response.ok) throw new Error('Failed to follow user');
    return await response.json();
  } catch (error) {
    console.error('Error following user:', error);
    return null;
  }
};

export const unfollowUser = async (username: string, followerId: string) => {
  try {
    const response = await fetch(`/api/users/${username}/unfollow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower_id: followerId })
    });
    if (!response.ok) throw new Error('Failed to unfollow user');
    return await response.json();
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return null;
  }
};

export const submitUserReview = async (username: string, reviewerId: string, isPositive: boolean, comment: string) => {
  try {
    const response = await fetch(`/api/users/${username}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer_id: reviewerId, is_positive: isPositive, comment })
    });
    if (!response.ok) throw new Error('Failed to submit review');
    return await response.json();
  } catch (error) {
    console.error('Error submitting review:', error);
    return null;
  }
};

export const getCollectionRanking = async (limit: number = 5) => {
  try {
    const response = await fetch(`/api/rankings/colecao?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch ranking');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching collection ranking:', error);
    return [];
  }
};

export const getOffersRanking = async (limit: number = 5) => {
  try {
    const response = await fetch(`/api/rankings/ofertas?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch ranking');
    const data = await response.json();
    return data;
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
  try {
    let query = supabase.from('product_types').select('*');
    if (gameId && gameId !== 'all') query = query.eq('game_id', gameId);
    
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
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
