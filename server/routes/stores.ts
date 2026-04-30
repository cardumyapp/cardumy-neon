import express from "express";
import { supabaseAdmin } from "../supabase.js";

const router = express.Router();

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
      .select('*')
      .eq('store_id', storeId)
      .order('dia', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/lojas/semanais", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { store_id, jogo, dia, horario, valor_insc, observacao } = req.body;
    const { data, error } = await supabaseAdmin
      .from('store_schedule')
      .insert({ store_id, jogo, dia, horario, valor_insc, observacao })
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

router.post("/lojas/estoque/update", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { store_id, product_id, quantity, store_price, pre_sale } = req.body;
    
    // Validate required fields
    if (!store_id || !product_id) {
        return res.status(400).json({ error: "store_id and product_id are required" });
    }

    const { data, error } = await supabaseAdmin
      .from('store_stock')
      .upsert({ 
        store_id, 
        product_id, 
        quantity: quantity || 0,
        store_price: store_price || 0,
        pre_sale: !!pre_sale,
        updated_at: new Date().toISOString()
      }, { onConflict: 'store_id,product_id' })
      .select();
    
    if (error) throw error;
    res.json({ status: "ok", data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
