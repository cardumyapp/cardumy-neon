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

  // Set up real-time subscription
  const subscription = supabase
    .channel('public:products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
    .subscribe();

  return () => {
    subscription.unsubscribe();
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

  const subscription = supabase
    .channel('public:stores')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, fetchStores)
    .subscribe();

  return () => {
    subscription.unsubscribe();
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
      .single();

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

export const getListCards = (userId: string, listType: 'cards' | 'wishlist' | 'offerlist', callback: (cards: any[]) => void) => {
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

  const subscription = supabase
    .channel(`public:${table}:${userId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: table,
      filter: `user_id=eq.${userId}`
    }, fetchList)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const createBinder = async (userId: string, name: string, gameId: string, gameName: string) => {
  try {
    const { data, error } = await supabase
      .from('user_binders')
      .insert({
        user_id: userId,
        name,
        game_id: gameId
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating binder:', error);
    throw error;
  }
};

export const getBinders = (userId: string, callback: (binders: any[]) => void) => {
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

  const subscription = supabase
    .channel(`public:user_binders:${userId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'user_binders',
      filter: `user_id=eq.${userId}`
    }, fetchBinders)
    .subscribe();

  return () => {
    subscription.unsubscribe();
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
      .single();
    
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
        .single();
      if (insertError) throw insertError;
      cardRecordId = newCard.id;
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

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
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

export const seedDatabase = async () => {
  try {
    const response = await fetch('/api/seed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to seed database');
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};
