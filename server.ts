import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import NodeCache from "node-cache";
import fetch from "node-fetch";

dotenv.config();

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // Cache for 60 seconds by default

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

  // Request logger - FIRST
  app.use((req, res, next) => {
    // Skip logging for static assets to reduce noise
    const isStatic = req.url.startsWith('/src/') || 
                    req.url.startsWith('/@vite') || 
                    req.url.startsWith('/node_modules/') ||
                    req.url.endsWith('.tsx') ||
                    req.url.endsWith('.ts') ||
                    req.url.endsWith('.css') ||
                    req.url.endsWith('.js');

    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (!isStatic || res.statusCode >= 400) {
        console.log(`${new Date().toISOString()} - [SERVER] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // Global Error Handlers
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
    // In a real prod app, you might want to exit, but here we try to keep going
  });

  app.use(express.json());

  // CORS middleware for iframe environment
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Supabase Admin Client (Service Role)
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) console.warn("[WARN] VITE_SUPABASE_URL is missing in environment variables.");
  if (!supabaseServiceKey) console.warn("[WARN] SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.");

  const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;

  if (supabaseAdmin) {
    console.log("[INFO] Supabase Admin initialized successfully.");
  } else {
    console.error("[ERROR] Supabase Admin failed to initialize. Check your environment variables.");
  }

  // Diagnosis Route
  app.get("/api/health", async (req, res) => {
    let dbStatus = "not_configured";
    let dbDetails: any = null;
    let tables: any = {};

    if (supabaseAdmin) {
      try {
        // Test connection
        const { data: users, error: uError } = await supabaseAdmin.from('users').select('id').limit(1);
        if (uError) {
          dbStatus = "error";
          dbDetails = uError;
        } else {
          dbStatus = "connected";
          
          // Probe some tables
          const tableToProbe = ['users', 'cards', 'cardgames', 'store_stock', 'stores'];
          for (const table of tableToProbe) {
            const { error: probeError } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true }).limit(1);
            tables[table] = probeError ? `Error: ${probeError.message}` : "Exists";
          }

          // Try to get columns for cards table
          const { data: columns, error: colError } = await supabaseAdmin
            .from('cards')
            .select('*')
            .limit(1);
          
          if (!colError && columns && columns.length > 0) {
            tables.cards_columns = Object.keys(columns[0]);
          } else if (colError) {
            tables.cards_columns_error = colError.message;
          }
        }
      } catch (err: any) {
        dbStatus = "exception";
        dbDetails = err.message;
      }
    }

    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      supabase: !!supabaseAdmin,
      database_connectivity: dbStatus,
      database_error: dbDetails,
      tables
    });
  });

  // API Routes
  app.get("/api/ping", (req, res) => {
    res.json({ status: "pong", time: new Date().toISOString() });
  });

  app.get("/api/cards", async (req: express.Request, res: express.Response) => {
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

  app.post("/api/cards/sync", async (req: express.Request, res: express.Response) => {
    console.log(`[API] POST /api/cards/sync - Body:`, JSON.stringify(req.body));
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured on server" });
    try {
      const { card } = req.body;
      if (!card || !card.name || !card.game) {
        console.warn(`[SYNC-CARD] Missing data: name=${!!card?.name}, game=${!!card?.game}`);
        return res.status(400).json({ error: "Dados da carta incompletos" });
      }

      // Cleanup slug logic for game lookup
      const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const gameSlug = slugify(card.game);
      console.log(`[SYNC-CARD] Syncing card: ${card.name} (${gameSlug})`);
      
      // 1. Get Game ID
      const { data: game, error: gameError } = await supabaseAdmin
        .from('cardgames')
        .select('id')
        .eq('slug', gameSlug)
        .maybeSingle();
      
      if (gameError) {
        console.error(`[SYNC-CARD] Error fetching game: ${JSON.stringify(gameError)}`);
        throw gameError;
      }
      if (!game) {
        console.warn(`[SYNC-CARD] Game not found: ${gameSlug}`);
        return res.status(404).json({ error: `Jogo '${card.game}' não encontrado no sistema` });
      }

      // 2. Try to find card by its external_id
      // Homura / Scryfall usually provide an ID. Or we use the code.
      const externalId = String(card.id || card.code || card.number || slugify(card.name));
      
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('cards')
        .select('*')
        .eq('external_id', externalId)
        .eq('game_id', game.id)
        .maybeSingle();
      
      if (fetchError) {
        console.error(`[SYNC-CARD] Error fetching existing card: ${JSON.stringify(fetchError)}`);
        // Fallback search by name if external_id query failed (e.g. column missing, but it's in the schema)
      }

      if (existing) {
        console.log(`[SYNC-CARD] Card exists:`, existing.id);
        return res.json(existing);
      }

      // 3. Insert new card - ONLY use columns from schema
      console.log(`[SYNC-CARD] Inserting new card: ${card.name} (ext: ${externalId})`);
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
      
      if (insertError) {
        console.error(`[SYNC-CARD] Insert error: ${JSON.stringify(insertError)}`);
        throw insertError;
      }
      
      console.log(`[SYNC-CARD] Successfully synced card:`, newCard?.id);
      res.json(newCard);
    } catch (error: any) {
      console.error('[SERVER ERROR] sync-card:', JSON.stringify(error));
      res.status(500).json({ 
        error: "Erro interno ao sincronizar carta", 
        message: error.message,
        details: error.details || error.code || {}
      });
    }
  });

  app.post("/api/seed", async (req: express.Request, res: express.Response) => {
    res.json({ message: "Seeding disabled" });
  });

  app.post("/api/update-profile", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin client not configured" });
    }

    try {
      const { userId, updates } = req.body;
      console.log(`[API] POST /api/update-profile - User: ${userId}, Updates:`, JSON.stringify(updates));
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Basic info fields allowed to be updated by the user
      const allowedFields = [
        'username', 
        'codename', 
        'avatar', 
        'banner_url', 
        'favorite_cardgame_id', 
        'gender', 
        'birth_date', 
        'phone', 
        'fighter_tags',
        'bio'
      ];

      // Filter updates to restricted basic info list
      const filteredUpdates: any = {};
      Object.keys(updates).forEach(key => {
        let targetKey = key;
        
        // Map some common frontend field names to database columns
        if (key === 'photoURL' || key === 'avatar') targetKey = 'avatar';
        if (key === 'cover_url' || key === 'banner_url') targetKey = 'banner_url';
        if (key === 'favorite_game' || key === 'favorite_cardgame_id') targetKey = 'favorite_cardgame_id';

        if (allowedFields.includes(targetKey)) {
          let val = updates[key];
          
          // Data normalization
          if (targetKey === 'birth_date' && val === "") val = null;
          if (targetKey === 'favorite_cardgame_id' && (val === "" || val === null)) val = null;
          if (targetKey === 'favorite_cardgame_id' && val !== null) val = Number(val);
          
          if (targetKey === 'fighter_tags' && Array.isArray(val)) {
            val = val.join(', '); // Convert array to comma-separated string for text field
          }
          
          filteredUpdates[targetKey] = val;
        }
      });

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({ error: "No valid basic information provided for update" });
      }

      // Always set updated_at
      filteredUpdates.updated_at = new Date().toISOString();

      console.log('Updating user profile for ID:', userId);
      console.log('Filtered updates:', filteredUpdates);

      // Lookup function to find user by ID, Email or Username
      const findUser = async (id: string | number) => {
        const idStr = String(id);
        
        // Try ID first (numeric or UUID)
        const { data: byId } = await supabaseAdmin.from('users').select('id').eq('id', id).maybeSingle();
        if (byId) return byId;

        // Try Email
        if (idStr.includes('@')) {
          const { data: byEmail } = await supabaseAdmin.from('users').select('id').eq('email', idStr).maybeSingle();
          if (byEmail) return byEmail;
        }

        // Try Username
        const { data: byUsername } = await supabaseAdmin.from('users').select('id').eq('username', idStr).maybeSingle();
        return byUsername;
      };

      const targetUser = await findUser(userId);

      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { data, error: updateError } = await supabaseAdmin
        .from('users')
        .update(filteredUpdates)
        .eq('id', targetUser.id)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error(`[DB ERROR] update-profile failure: ${updateError.code} - ${updateError.message}`, updateError.details);
        return res.status(errorToStatus(updateError)).json({ 
          error: "Erro ao atualizar perfil no banco de dados", 
          code: updateError.code,
          message: updateError.message 
        });
      }
      
      return res.json(data);
    } catch (error: any) {
      console.error('[SERVER EXCEPTION] update-profile:', error);
      res.status(500).json({ error: "Erro interno no servidor", details: error.message });
    }
  });

  // Helper filter for Supabase Errors
  function errorToStatus(error: any) {
    if (error.code === 'PGRST116') return 404; // Not found
    if (error.code?.startsWith('23')) return 409; // Conflict/Unique constraint
    if (error.code?.startsWith('42')) return 403; // Permission/Schema
    return 500;
  }

  // Store Routes - Replicating Python logic
  app.get("/api/rankings/colecao", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const limit = parseInt(req.query.limit as string) || 5;
    
    const cacheKey = `ranking_colecao_${limit}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    try {
      // Fallback to JS aggregation as the primary logic since RPC is missing
      const { data: users, error: uError } = await supabaseAdmin.from('users').select('id, username, codename, avatar');
      if (uError) throw uError;
      
      const ranking = await Promise.all(users.map(async (u) => {
        const { count } = await supabaseAdmin.from('user_cards').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
        return { ...u, total_cards: count || 0 };
      }));
      
      const result = ranking.sort((a, b) => b.total_cards - a.total_cards).slice(0, limit);
      cache.set(cacheKey, result, 300); // 5 minutes cache for rankings
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rankings/ofertas", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const limit = parseInt(req.query.limit as string) || 5;

    const cacheKey = `ranking_ofertas_${limit}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    try {
      // Grouping in Supabase/PostgREST is often handled via RPC for complex aggregations
      const { data: users, error: uError } = await supabaseAdmin.from('users').select('id, username, codename, avatar');
      if (uError) throw uError;
      
      const ranking = await Promise.all(users.map(async (u) => {
        // Checking if 'trade_offers' or 'offerlist' is the correct table
        const { count } = await supabaseAdmin.from('trade_offers').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
        return { ...u, offers_count: count || 0 };
      }));
      
      const result = ranking.sort((a, b) => b.offers_count - a.offers_count).slice(0, limit);
      cache.set(cacheKey, result, 300); // 5 minutes cache for rankings
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:username/profile", async (req: express.Request, res: express.Response) => {
    const { username } = req.params;
    const { follower_id } = req.query;
    console.log(`[API] GET /api/users/${username}/profile - Follower: ${follower_id || 'none'}`);
    
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured on server" });

    const cacheKey = `profile_${username}_${follower_id || 'none'}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    try {
      // 1. Get user by username, ID or Email
      let query = supabaseAdmin.from('users').select('*, cardgames(id, name)');
      
      const isNumeric = !isNaN(Number(username)) && !username.includes('@');
      const isEmail = username.includes('@');

      if (isNumeric) {
        query = query.eq('id', username);
      } else if (isEmail) {
        query = query.eq('email', username);
      } else {
        query = query.eq('username', username);
      }
      
      const { data: user, error: userError } = await query.maybeSingle();
      if (userError) throw userError;
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

      // Check if following
      let isFollowing = false;
      if (follower_id) {
        const { data: followDoc } = await supabaseAdmin
          .from('user_followers')
          .select('*')
          .eq('follower_id', follower_id)
          .eq('followed_id', user.id)
          .maybeSingle();
        isFollowing = !!followDoc;
      }

      // 2. Collection stats
      const { count: collectionCount } = await supabaseAdmin.from('user_cards').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { count: wishlistCount } = await supabaseAdmin.from('wishlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { count: offerCount } = await supabaseAdmin.from('offerlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

      // 3. Followers/Following
      const { count: followersCount } = await supabaseAdmin.from('user_followers').select('*', { count: 'exact', head: true }).eq('followed_id', user.id);
      const { count: followingCount } = await supabaseAdmin.from('user_followers').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);

      // 4. Reviews
      const { data: reviews, error: reviewError } = await supabaseAdmin
        .from('user_reviews')
        .select(`
          id,
          comment,
          is_positive,
          created_at,
          reviewer:users!reviewer_id(codename, avatar)
        `)
        .eq('reviewed_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: counters } = await supabaseAdmin
        .from('user_reviews')
        .select('is_positive')
        .eq('reviewed_id', user.id);
      
      const likes = counters?.filter(c => c.is_positive).length || 0;
      const dislikes = counters?.filter(c => !c.is_positive).length || 0;
      const totalReviews = likes + dislikes;
      const approvalRate = totalReviews > 0 ? Math.round((likes / totalReviews) * 100) : null;

      const profileData = {
        user,
        is_following: isFollowing,
        stats: {
          collection_size: collectionCount || 0,
          wishlist_size: wishlistCount || 0,
          offers_size: offerCount || 0,
          followers: followersCount || 0,
          following: followingCount || 0,
          likes,
          dislikes,
          total_reviews: totalReviews,
          approval_rate: approvalRate
        },
        reviews: reviews || []
      };

      cache.set(cacheKey, profileData, 60); // Cache profile for 1 minute
      res.json(profileData);
    } catch (error: any) {
      console.error('Error fetching full user profile:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:username/follow", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { username } = req.params;
    const { follower_id: raw_follower_id } = req.body;
    const follower_id = raw_follower_id === "" ? null : raw_follower_id;

    if (!follower_id) return res.status(400).json({ error: "Follower ID is required" });

    try {
      const { data: targetUser } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
      if (!targetUser) return res.status(404).json({ error: "Usuário não encontrado" });

      if (follower_id == targetUser.id) return res.status(400).json({ error: "Você não pode seguir a si mesmo" });

      const { error } = await supabaseAdmin
        .from('user_followers')
        .upsert({ follower_id, followed_id: targetUser.id }, { onConflict: 'follower_id,followed_id' });
      
      if (error) throw error;
      
      // Invalidate cache
      const keys = cache.keys();
      keys.filter(k => k.startsWith(`profile_${username}`)).forEach(k => cache.del(k));
      
      res.json({ message: "Seguindo com sucesso" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:username/unfollow", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { username } = req.params;
    const { follower_id: raw_follower_id } = req.body;
    const follower_id = raw_follower_id === "" ? null : raw_follower_id;

    if (!follower_id) return res.status(400).json({ error: "Follower ID is required" });

    try {
      const { data: targetUser } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
      if (!targetUser) return res.status(404).json({ error: "Usuário não encontrado" });

      const { error } = await supabaseAdmin
        .from('user_followers')
        .delete()
        .eq('follower_id', follower_id)
        .eq('followed_id', targetUser.id);
      
      if (error) throw error;

      // Invalidate cache
      const keys = cache.keys();
      keys.filter(k => k.startsWith(`profile_${username}`)).forEach(k => cache.del(k));

      res.json({ message: "Deixou de seguir" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:username/review", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { username } = req.params;
    const { reviewer_id: raw_reviewer_id, is_positive, comment } = req.body;
    const reviewer_id = raw_reviewer_id === "" ? null : raw_reviewer_id;

    if (!reviewer_id) return res.status(400).json({ error: "Reviewer ID is required" });

    try {
      const { data: targetUser } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
      if (!targetUser) return res.status(404).json({ error: "Usuário não encontrado" });

      const { error } = await supabaseAdmin
        .from('user_reviews')
        .upsert({
          reviewer_id,
          reviewed_id: targetUser.id,
          is_positive,
          comment: comment?.slice(0, 255),
          created_at: new Date().toISOString()
        }, { onConflict: 'reviewer_id,reviewed_id' });
      
      if (error) throw error;

      // Invalidate cache
      const keys = cache.keys();
      keys.filter(k => k.startsWith(`profile_${username}`)).forEach(k => cache.del(k));

      res.json({ message: "Avaliação registrada" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/atividades", async (req: express.Request, res: express.Response) => {
    console.log(`[API] GET /api/atividades - Limit: ${req.query.limit || 10}`);
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured on server" });
    const limit = parseInt(req.query.limit as string) || 10;
    
    const cacheKey = `atividades_${limit}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    try {
      // First try action_logs
      const { data, error } = await supabaseAdmin
        .from('action_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn(`[ATIVIDADES] Table action_logs failed: ${error.message}`);
        // Try social_feeds
        const { data: sData, error: sError } = await supabaseAdmin
          .from('social_feeds')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (sError) {
          console.warn(`[ATIVIDADES] Table social_feeds failed: ${sError.message}`);
          return res.json([]);
        }

        const formatted = (sData || []).map(item => ({
          id: item.id,
          user: item.username || 'Usuário',
          userId: item.user_id,
          avatar: item.avatar_url || item.avatar,
          action: item.activity_type || 'fez uma ação',
          target: item.content || 'algo',
          timestamp: new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(item.created_at).toLocaleDateString('pt-BR')
        }));
        return res.json(formatted);
      }

      const formatted = (data || []).map(item => ({
        id: item.id,
        user: item.username || 'Usuário',
        userId: item.user_id,
        avatar: item.avatar,
        action: item.action || 'fez uma ação',
        target: `${item.entity || ''} ${item.details?.name || ''}`,
        timestamp: new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(item.created_at).toLocaleDateString('pt-BR')
      }));

      cache.set(cacheKey, formatted, 30);
      res.json(formatted);
    } catch (error: any) {
      console.error('[SERVER ERROR] GET /api/atividades:', JSON.stringify(error));
      res.status(500).json({ error: error.message || 'Unknown error in activities' });
    }
  });

  app.get("/api/torneios", async (req: express.Request, res: express.Response) => {
    console.log("[API] GET /api/torneios");
    if (!supabaseAdmin) {
      console.error("[TORNEIOS] Supabase Admin NOT configured");
      return res.status(500).json({ error: "Supabase not configured on server" });
    }
    try {
      // First attempt with joins - using maybe different names for relationships
      const { data, error } = await supabaseAdmin
        .from('tournaments')
        .select(`
          *,
          cardgame:cardgames(name),
          format:tournament_formats(name)
        `)
        .order('start_date', { ascending: true });
      
      if (error) {
        console.warn(`[TORNEIOS] Join failed (${error.message}), falling back to simple select`);
        const { data: simpleData, error: simpleError } = await supabaseAdmin
          .from('tournaments')
          .select('*')
          .order('start_date', { ascending: true });
        
        if (simpleError) throw simpleError;
        
        // Manual enrichment if possible or just return simple data
        return res.json(simpleData);
      }
      
      // Normalize data if joins worked but return format is different
      const normalized = (data || []).map(t => ({
        ...t,
        cardgames: (t as any).cardgame,
        tournament_formats: (t as any).format
      }));
      
      res.json(normalized);
    } catch (error: any) {
      console.error('[SERVER ERROR] GET /api/torneios:', JSON.stringify(error));
      res.status(500).json({ error: error.message || 'Unknown error in tournaments' });
    }
  });


  app.get("/api/lojas", async (req: express.Request, res: express.Response) => {
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

  app.get("/api/lojas/:username", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { username } = req.params;
    try {
      // 1. Get user (store owner)
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, username, codename, avatar, role_id')
        .eq('username', username)
        .maybeSingle();
      
      if (userError) throw userError;
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

      // 2. Get store info for this user
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, name, slug')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (storeError) throw storeError;

      // 3. Get Wishlist size
      const { count: wishlistCount } = await supabaseAdmin
        .from('wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      let stockCount = 0;
      if (store) {
        // 4. Get Store Stock size using stores.id
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
        offers_size: 10 // Mocked as in python
      });
    } catch (error: any) {
      console.error('Error fetching store profile info:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lojas/:username/torneios", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { username } = req.params;
    try {
      // 1. Get user (store owner)
      const { data: user } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
      if (!user) return res.status(404).json({ error: "Loja não encontrada" });

      // 2. Get Tournaments with joins
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
        console.warn('Error fetching store tournaments with joins, falling back to simple select:', error.message);
        const { data: simpleData, error: simpleError } = await supabaseAdmin
          .from('tournaments')
          .select('*')
          .eq('created_by', user.id)
          .order('start_date', { ascending: false });
        
        if (simpleError) throw simpleError;
        res.json({
          tournaments: simpleData,
          cardgames: [],
          formats: []
        });
        return;
      }

      // 3. Metadata for selects (replicating python logic)
      const { data: cardgames } = await supabaseAdmin.from('cardgames').select('id, name').order('name');
      const { data: formats } = await supabaseAdmin.from('tournament_formats').select('id, name').order('name');

      // 4. Transform format exactly like Python
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

      const scheduled = formatted.filter(t => t.status === "scheduled");
      const normal = formatted.filter(t => t.status !== "scheduled");

      res.json({
        torneios: normal,
        torneios_agendados: scheduled,
        cardgames: cardgames || [],
        formats: formats || []
      });
    } catch (error: any) {
      console.error('Error fetching store tournaments:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lojas/:storeId/semanais", async (req: express.Request, res: express.Response) => {
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

  app.post("/api/lojas/semanais", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    try {
      // Note: in a real app we'd verify auth here. For now we assume userId is passed or inferred.
      const { store_id, jogo, dia, horario, valor_insc, observacao } = req.body;
      const { data, error } = await supabaseAdmin
        .from('store_schedule')
        .insert({
          store_id,
          jogo,
          dia,
          horario,
          valor_insc,
          observacao
        })
        .select();
      if (error) throw error;
      res.json({ ok: true, data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lojas/:username/estoque", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { username } = req.params;
    try {
      // Find store by username (user table)
      const { data: user } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

      const { data: store } = await supabaseAdmin.from('stores').select('id').eq('user_id', user.id).maybeSingle();
      if (!store) return res.status(404).json({ error: "Loja não encontrada" });

      const { data, error } = await supabaseAdmin
        .from('store_stock')
        .select(`
          card_id,
          quantity,
          store_price,
          cards:card_id (
            id, name, slug, product_type, image_url, beauty_name, mspr, cardgames ( name )
          )
        `)
        .eq('store_id', store.id);
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/lojas/estoque/update", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    try {
      const { store_id, card_id, quantity } = req.body;
      const { data, error } = await supabaseAdmin
        .from('store_stock')
        .upsert({
          store_id,
          card_id,
          quantity
        }, { onConflict: 'store_id,card_id' })
        .select();
      
      if (error) throw error;
      res.json({ status: "ok", data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/produtos", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const game = req.query.game as string;
      const type = req.query.type as string;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin.from('cards').select('*, cardgames(name)', { count: 'exact' });
      
      if (game) query = query.eq('cardgames.name', game);
      if (type) query = query.eq('product_type', type);

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

  app.get("/api/produtos/:id", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { id } = req.params;
    try {
      const { data: product, error: pError } = await supabaseAdmin
        .from('cards')
        .select('*, cardgames(name)')
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
        .eq('card_id', id)
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

  // API Call: syncUser
  app.post("/api/sync-user", async (req: express.Request, res: express.Response) => {
    console.log(`[SYNC-USER] Request received for: ${req.body?.userData?.email}`);
    if (!supabaseAdmin) {
      console.error("[SYNC-USER] Error: Supabase Admin client not configured");
      return res.status(500).json({ error: "Supabase Admin client not configured" });
    }

    try {
      const { userData } = req.body;
      if (!userData || !userData.email) {
        return res.status(400).json({ error: "Invalid user data" });
      }

      console.log(`[SYNC-USER] Fetching existing user by email: ${userData.email}`);

      // Try to find user by email
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`[SYNC-USER] [DB FETCH ERROR] ${fetchError.code}: ${fetchError.message}`);
        throw fetchError;
      }

      const isAdmin = userData.email === 'cardumyapp@gmail.com';

      if (existing) {
        console.log(`[SYNC-USER] User found (ID: ${existing.id}). Updating...`);
        // Update user but handle potential codename conflicts if necessary
        // Actually, if we are syncing, we might want to keep the existing codename if the new one is null
        const { data, error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            avatar: userData.photoURL || existing.avatar,
            codename: userData.displayName || existing.codename,
            role_id: isAdmin ? 1 : (existing.role_id || 7),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .maybeSingle();

        if (updateError) {
          console.error(`[SYNC-USER] [DB UPDATE ERROR] ${updateError.code}: ${updateError.message}`);
          // If update fails due to codename uniqueness, try updating without codename
          if (updateError.message?.includes('users_codename_key')) {
             console.warn('[SYNC-USER] Codename conflict, retrying without codename update');
             const { data: data2, error: err2 } = await supabaseAdmin
               .from('users')
               .update({
                 avatar: userData.photoURL || existing.avatar,
                 role_id: isAdmin ? 1 : (existing.role_id || 7),
                 updated_at: new Date().toISOString()
               })
               .eq('id', existing.id)
               .select()
               .maybeSingle();
             if (err2) throw err2;
             return res.json(data2);
          }
          throw updateError;
        }
        return res.json(data);
      } else {
        console.log(`[SYNC-USER] Creating new user record for: ${userData.email}`);
        // Create new user
        // Ensure unique username
        const baseUsername = (userData.displayName || 'user').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
        const codename = userData.displayName || username;

        const { data, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            username,
            codename,
            email: userData.email,
            password: 'social-login', // Placeholder
            avatar: userData.photoURL || null,
            vip: false,
            role_id: isAdmin ? 1 : 7
          })
          .select()
          .maybeSingle();

        if (insertError) {
          // If insert fails because email already exists (race condition)
          if (insertError.message?.includes('users_email_key')) {
             console.log('Email sync conflict, fetching existing user instead');
             const { data: retryData, error: retryError } = await supabaseAdmin
               .from('users')
               .select('*')
               .eq('email', userData.email)
               .maybeSingle();
             if (retryError) throw retryError;
             return res.json(retryData);
          }
          // If insert fails due to codename uniqueness, try inserts with unique codenames
          if (insertError.message?.includes('users_codename_key')) {
            console.warn('Codename conflict on insert, retrying with unique codename');
            const { data: data2, error: err2 } = await supabaseAdmin
              .from('users')
              .insert({
                username,
                codename: `${codename}#${Math.floor(Math.random() * 999)}`,
                email: userData.email,
                password: 'social-login',
                avatar: userData.photoURL || null,
                vip: false,
                role_id: isAdmin ? 1 : 7
              })
              .select()
              .maybeSingle();
            if (err2) throw err2;
            return res.json(data2);
          }
          throw insertError;
        }
        return res.json(data);
      }
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/search-users", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { q } = req.query;
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, username, codename, avatar, role_id')
        .or(`username.ilike.%${q}%,codename.ilike.%${q}%`)
        .limit(10);
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blog-posts", async (req, res) => {
    console.log(`[API] GET /api/blog-posts - PerPage: ${req.query.per_page || 3}`);
    const perPage = req.query.per_page || 3;
    try {
      const response = await fetch(`https://cardumy.blog/wp-json/wp/v2/posts?per_page=${perPage}&_embed`);
      if (!response.ok) throw new Error('Failed to fetch from Cardumy Blog');
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Blog proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch blog posts', detail: error.message });
    }
  });

  // 404 for API routes
  app.use('/api', (req, res) => {
    console.warn(`404 API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `The requested API route ${req.method} ${req.url} was not found on this server.` });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`${new Date().toISOString()} - [SERVER] Started listening on 0.0.0.0:${PORT}`);
    console.log(`Supabase Admin configured: ${!!supabaseAdmin}`);
  });
  } catch (error) {
    console.error("CRITICAL: Server failed to start:", error);
  }
}

startServer();
