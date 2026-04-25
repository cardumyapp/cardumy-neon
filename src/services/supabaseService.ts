import { supabase } from '../lib/supabase';

export const getProducts = (callback: (products: any[]) => void) => {
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
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

export const addCardToList = async (userId: any, listType: 'cards' | 'wishlist' | 'offerlist', card: any, quantity: number = 1) => {
  const table = listType === 'cards' ? 'user_cards' : listType;
  const gameSlug = card.game.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  
  try {
    // Check if card already exists in list
    const { data: existing, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .eq('card_id', card.id || card.cardId)
      .eq('game', gameSlug)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (existing) {
      const { error: updateError } = await supabase
        .from(table)
        .update({ quantidade: existing.quantidade + quantity })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from(table)
        .insert({
          user_id: userId,
          game: gameSlug,
          card_id: card.id || card.cardId,
          name: card.name,
          image_url: card.imageUrl || card.images?.small,
          quantidade: quantity,
          raridade: card.rarity || ''
        });
      if (insertError) throw insertError;
    }

    // Log action
    await supabase.from('action_logs').insert({
      user_id: userId,
      action: 'adicionou',
      entity: 'a carta',
      entity_id: card.id || card.cardId,
      details: { destino: listType, name: card.name, quantidade: quantity, game: gameSlug }
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
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error(`Error fetching ${listType}:`, error);
      return;
    }
    callback(data || []);
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
  const gameSlug = card.game.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  try {
    // First ensure card is in user_cards or just link it?
    // The schema shows binder_cards links binder and user_cards
    // But user_cards might not have the card yet if we are adding directly.
    // Let's assume we need to find or create the card in user_cards first.
    
    let cardRecordId;
    const { data: existingCard } = await supabase
      .from('user_cards')
      .select('id')
      .eq('user_id', userId)
      .eq('card_id', card.cardId || card.id)
      .eq('game', gameSlug)
      .maybeSingle();
    
    if (existingCard) {
      cardRecordId = existingCard.id;
    } else {
      const { data: newCard, error: insertError } = await supabase
        .from('user_cards')
        .insert({
          user_id: userId,
          game: gameSlug,
          card_id: card.cardId || card.id,
          name: card.name,
          image_url: card.imageUrl,
          quantidade: 1
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
    const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    stats.products = productsCount || 0;
  } catch (e) { console.warn('Table products not found or inaccessible'); }

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

export const syncUser = async (userData: any) => {
  try {
    const response = await fetch('/api/sync-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userData })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync user');
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
    const response = await fetch(`/api/lojas/${username}`);
    if (!response.ok) throw new Error('Failed to fetch store profile info');
    return await response.json();
  } catch (error) {
    console.error('Error fetching store profile info:', error);
    return null;
  }
};

export const getStoreSchedule = async (storeId: string) => {
  try {
    const response = await fetch(`/api/lojas/${storeId}/semanais`);
    if (!response.ok) throw new Error('Failed to fetch store schedule');
    return await response.json();
  } catch (error) {
    console.error('Error fetching store schedule:', error);
    return [];
  }
};

export const updateStoreStock = async (store_id: string, product_id: number | string, quantity: number) => {
  try {
    const response = await fetch('/api/lojas/estoque/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_id, product_id, quantity })
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
    const response = await fetch(`/api/atividades?limit=${limit}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Activities fetch error response:', errorText);
      throw new Error(`Failed to fetch activities: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching activities:', error?.message || error);
    return [];
  }
};

export const getAllTournaments = async () => {
  try {
    const response = await fetch('/api/torneios');
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tournaments fetch error response:', errorText);
      throw new Error(`Failed to fetch tournaments: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching tournaments:', error?.message || error);
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
    const url = `/api/users/${username}/profile${followerId ? `?follower_id=${followerId}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch full user profile');
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
    return await response.json();
  } catch (error) {
    console.error('Error fetching collection ranking:', error);
    return [];
  }
};

export const getOffersRanking = async (limit: number = 5) => {
  try {
    const response = await fetch(`/api/rankings/ofertas?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch ranking');
    return await response.json();
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
