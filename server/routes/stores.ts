import express from "express";
import { supabaseAdmin } from "../supabase.js";
import { authenticate, requireLojista } from "../middleware/auth.js";

const router = express.Router();

router.get("/lojas/minha", authenticate, requireLojista, async (req: any, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { data, error } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('user_id', req.user.id) // req.user.id is now the integer ID
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Loja não encontrada para este usuário" });
    
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/lojas/:id", authenticate, requireLojista, async (req: any, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { id } = req.params;
  const updates = req.body;

  try {
    // Security check
    const { data: store } = await supabaseAdmin
      .from('stores')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!store || store.user_id !== req.user.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { data, error } = await supabaseAdmin
      .from('stores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/lojas", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { data, error } = await supabaseAdmin
      .from('stores')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/lojas/:username", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { username } = req.params;
  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, codename, avatar, role_id')
      .eq('username', username)
      .maybeSingle();
    
    if (userError) throw userError;
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, name, slug')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (storeError) throw storeError;

    const { count: wishlistCount } = await supabaseAdmin
      .from('wishlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    let stockCount = 0;
    if (store) {
      const { count: sCount } = await supabaseAdmin
        .from('store_stock')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .gt('quantity', 0);
      stockCount = sCount || 0;
    }

    res.json({
      user,
      store,
      wishlist_size: wishlistCount || 0,
      stock_size: stockCount,
      offers_size: 10,
      is_open: store ? (await supabaseAdmin.rpc('is_store_open', { p_store_id: store.id })).data : false
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/lojas/:storeId/hours", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { storeId } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('store_hours')
      .select('*')
      .eq('store_id', storeId)
      .order('day_of_week', { ascending: true })
      .order('open_time', { ascending: true });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/lojas/:username/torneios", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { username } = req.params;
  try {
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
    if (!user) return res.status(404).json({ error: "Loja não encontrada" });

    const { data: tournaments, error } = await supabaseAdmin
      .from('tournaments')
      .select(`
        id, name, max_players, start_date, status,
        cardgames ( name ),
        tournament_formats ( name )
      `)
      .eq('created_by', user.id)
      .order('start_date', { ascending: false });
    
    if (error) {
      const { data: simpleData, error: simpleError } = await supabaseAdmin
        .from('tournaments')
        .select('*')
        .eq('created_by', user.id)
        .order('start_date', { ascending: false });
      
      if (simpleError) throw simpleError;
      return res.json({ tournaments: simpleData, cardgames: [], formats: [] });
    }

    const { data: cardgames } = await supabaseAdmin.from('cardgames').select('id, name').order('name');
    const { data: formats } = await supabaseAdmin.from('tournament_formats').select('id, name').order('name');

    const formatted = (tournaments || []).map(t => ({
      id: t.id,
      name: t.name,
      max_players: t.max_players,
      start_date: t.start_date,
      status: t.status,
      imageUrl: null,
      cardgame_name: (t.cardgames as any)?.name,
      format_name: (t.tournament_formats as any)?.name
    }));

    res.json({
      torneios: formatted.filter(t => t.status !== "scheduled"),
      torneios_agendados: formatted.filter(t => t.status === "scheduled"),
      cardgames: cardgames || [],
      formats: formats || []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/lojas/:storeId/semanais", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { storeId } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('store_schedule')
      .select('*, cardgame:cardgames(name)')
      .eq('store_id', storeId)
      .order('dia', { ascending: true });
    if (error) throw error;
    res.json((data || []).map(s => ({ ...s, game_name: (s.cardgame as any)?.name })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/lojas/semanais", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { store_id, game_id, dia, horario, valor_insc, observacao } = req.body;
    const { data, error } = await supabaseAdmin
      .from('store_schedule')
      .insert({ store_id, game_id, dia, horario, valor_insc: parseFloat(valor_insc) || 0, observacao })
      .select();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/lojas/:username/estoque", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { username } = req.params;
  try {
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const { data: store } = await supabaseAdmin.from('stores').select('id').eq('user_id', user.id).maybeSingle();
    if (!store) return res.status(404).json({ error: "Loja não encontrada" });

    const { data, error } = await supabaseAdmin
      .from('store_stock')
      .select(`
        id,
        product_id,
        quantity,
        store_price,
        pre_sale,
        products:product_id (
          id, name, slug, image_url, cardgames ( name )
        )
      `)
      .eq('store_id', store.id);
    
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/lojas/:username/produtos_filtrados", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { username } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;
  const offset = (page - 1) * limit;
  const game = req.query.game as string;
  const selectedType = req.query.type as string;

  try {
    // 1. Get store by username
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
    if (!user) return res.status(404).json({ error: "Loja não encontrada" });

    const { data: store } = await supabaseAdmin.from('stores').select('id').eq('user_id', user.id).maybeSingle();
    if (!store) return res.status(404).json({ error: "Loja não encontrada" });

    const store_id = store.id;

    // 2. Fetch unique games in this store's stock
    const { data: stockGames } = await supabaseAdmin
      .from('store_stock')
      .select('products(cardgames(name))')
      .eq('store_id', store_id);

    const gamesList = Array.from(new Set(
      (stockGames || [])
        .map((s: any) => s.products?.cardgames?.name)
        .filter(Boolean)
    )).sort();

    // 3. Build filtered query
    let query = supabaseAdmin
      .from('store_stock')
      .select(`
        quantity,
        store_price,
        products!inner (
          id, name, slug, image_url, beauty_name, release_date, mspr,
          cardgames!inner ( name ),
          product_types ( name )
        )
      `, { count: 'exact' })
      .eq('store_id', store_id);

    if (game) {
      query = query.eq('products.cardgames.name', game);
    } else if (gamesList.length > 0) {
      query = query.eq('products.cardgames.name', gamesList[0]);
    }

    if (selectedType) {
      query = query.eq('products.product_types.name', selectedType);
    }

    const { data, count, error } = await query
      .order('products(name)', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // 4. Fetch unique types for the selected game in this store
    let typesQuery = supabaseAdmin
      .from('store_stock')
      .select('products!inner(product_types(name), cardgames!inner(name))')
      .eq('store_id', store_id);
    
    if (game || gamesList[0]) {
      typesQuery = typesQuery.eq('products.cardgames.name', game || gamesList[0]);
    }

    const { data: typeResults } = await typesQuery;
    const typesList = Array.from(new Set(
      (typeResults || [])
        .map((s: any) => s.products?.product_types?.name)
        .filter(Boolean)
    )).sort();

    res.json({
      produtos: (data || []).map((p: any) => ({
        id: p.products.id,
        name: p.products.name,
        slug: p.products.slug,
        image_url: p.products.image_url,
        game_name: p.products.cardgames.name,
        beauty_name: p.products.beauty_name,
        release_date: p.products.release_date,
        mspr: p.products.mspr,
        quantity: p.quantity,
        store_price: p.store_price
      })),
      total: count || 0,
      page,
      limit,
      has_next: (page * limit) < (count || 0),
      games: gamesList,
      types: typesList,
      shopname: username
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/lojas/estoque", authenticate, requireLojista, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { store_id, product_id, quantity, store_price, pre_sale } = req.body;
    
    // Validate required fields
    if (!store_id || !product_id) {
        return res.status(400).json({ error: "store_id and product_id are required" });
    }

    // Security check: Ensure the authenticated user owns this store
    const { data: store } = await supabaseAdmin
      .from('stores')
      .select('user_id')
      .eq('id', store_id)
      .single();

    if (!store || store.user_id !== (req as any).user.id) {
      return res.status(403).json({ error: "Você não tem permissão para gerenciar esta loja" });
    }

    // Check if exists
    const { data: existing } = await supabaseAdmin
      .from('store_stock')
      .select('id')
      .eq('store_id', store_id)
      .eq('product_id', product_id)
      .maybeSingle();

    let result;
    if (existing) {
      result = await supabaseAdmin
        .from('store_stock')
        .update({ 
          quantity: quantity || 0,
          store_price: store_price || 0,
          pre_sale: !!pre_sale,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select();
    } else {
      result = await supabaseAdmin
        .from('store_stock')
        .insert({ 
          store_id, 
          product_id, 
          quantity: quantity || 0,
          store_price: store_price || 0,
          pre_sale: !!pre_sale,
          updated_at: new Date().toISOString()
        })
        .select();
    }
    
    if (result.error) throw result.error;
    res.json({ status: "ok", data: result.data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/lojas/estoque/add", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { store_id, product_id, quantity, store_price } = req.body;
    
    if (!store_id || !product_id) {
        return res.status(400).json({ error: "store_id and product_id are required" });
    }

    const { data, error } = await supabaseAdmin
      .from('store_stock')
      .insert({ 
        store_id, 
        product_id, 
        quantity: parseInt(quantity) || 0,
        store_price: parseFloat(store_price) || null,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) throw error;
    res.json({ status: "ok", data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
