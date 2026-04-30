import express from "express";
import { supabaseAdmin } from "../supabase.js";
import fetch from "node-fetch";

const router = express.Router();

router.get("/cards", async (req, res) => {
  console.log(`[API] GET /api/cards - Query:`, req.query);
  const { game, ...rest } = req.query;
  if (!game) {
    return res.status(400).json({ error: "game obrigatório" });
  }

  const token = process.env.HOMURA_TOKEN;
  const baseUrl = process.env.VITE_HOMURA_URL || process.env.HOMURA_URL || "https://homura-cards.vercel.app";

  try {
    const searchParams = new URLSearchParams();
    Object.entries(rest).forEach(([key, value]) => {
      if (value) searchParams.append(key, String(value));
    });

    const url = `${baseUrl}/api/${game}/cards?${searchParams.toString()}`;
    console.log("Hitting external API:", url);
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      console.error("External API returned non-JSON response:", text);
      res.status(response.status).json({ error: "External API error", detail: text });
    }
  } catch (error: any) {
    console.error("Error fetching cards from external API:", error);
    res.status(500).json({ error: "Erro interno ao buscar cartas", message: error.message });
  }
});

router.post("/cards/sync", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured on server" });
  try {
    const { card } = req.body;
    if (!card || !card.name || !card.game) {
      return res.status(400).json({ error: "Dados da carta incompletos" });
    }

    const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const gameSlug = slugify(card.game);
    
    const { data: game, error: gameError } = await supabaseAdmin
      .from('cardgames')
      .select('id')
      .eq('slug', gameSlug)
      .maybeSingle();
    
    if (gameError) throw gameError;
    if (!game) {
      return res.status(404).json({ error: `Jogo '${card.game}' não encontrado no sistema` });
    }

    const externalId = String(card.id || card.code || card.number || slugify(card.name));
    
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('external_id', externalId)
      .eq('game_id', game.id)
      .maybeSingle();
    
    if (existing) {
      return res.json(existing);
    }

    const insertData = {
      name: card.name,
      game_id: game.id,
      external_id: externalId,
      image_url: card.imageUrl || card.image || null
    };

    const { data: newCard, error: insertError } = await supabaseAdmin
      .from('cards')
      .insert(insertData)
      .select()
      .maybeSingle();
    
    if (insertError) throw insertError;
    
    res.json(newCard);
  } catch (error: any) {
    console.error('[SERVER ERROR] sync-card:', error);
    res.status(500).json({ 
      error: "Erro interno ao sincronizar carta", 
      message: error.message
    });
  }
});

router.post("/produtos/add_nogame", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { name, slug, product_type, image_url, mspr } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: "Nome e slug são obrigatórios." });
    }

    // Attempt to find product_type_id if product_type (string name) is passed
    let product_type_id = null;
    if (product_type) {
      if (!isNaN(Number(product_type))) {
        product_type_id = Number(product_type);
      } else {
        const { data: typeData } = await supabaseAdmin
          .from('product_types')
          .select('id')
          .eq('name', product_type)
          .maybeSingle();
        if (typeData) product_type_id = typeData.id;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        game_id: null,
        name,
        slug,
        product_type_id,
        image_url,
        mspr: mspr || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;
    res.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error("Erro ao inserir produto (add_nogame):", error);
    res.status(500).json({ error: "Erro ao inserir produto", message: error.message });
  }
});

router.get("/produtos", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const game = req.query.game as string;
    const type = req.query.type as string;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from('products').select('*, cardgames(name), product_types(name)', { count: 'exact' });
    
    if (game) query = query.eq('cardgames.name', game);
    if (type) {
      if (!isNaN(Number(type))) {
        query = query.eq('product_type_id', type);
      } else {
        query = query.eq('product_types.name', type);
      }
    }

    const { data, count, error } = await query
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    res.json({
      produtos: data || [],
      total: count || 0,
      page,
      has_next: (page * limit) < (count || 0)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/produtos/:id", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { id } = req.params;
  try {
    const { data: product, error: pError } = await supabaseAdmin
      .from('products')
      .select('*, cardgames(name), product_types(name)')
      .eq('id', id)
      .maybeSingle();
    
    if (pError) throw pError;
    if (!product) return res.status(404).json({ error: "Carta não encontrada" });

    const { data: stores, error: sError } = await supabaseAdmin
      .from('store_stock')
      .select(`
        quantity, 
        store_price, 
        stores (
          id,
          name,
          slug,
          user:users!user_id (
            username, 
            codename, 
            avatar
          )
        )
      `)
      .eq('product_id', id)
      .gt('quantity', 0)
      .order('store_price', { ascending: true });
    
    if (sError) throw sError;

    res.json({
      produto: product,
      lojas: stores || []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
