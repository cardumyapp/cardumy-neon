import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Supabase Admin Client (Service Role)
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  // API Routes
  app.post("/api/seed", async (req: express.Request, res: express.Response) => {
    res.json({ message: "Seeding disabled" });
  });

  app.post("/api/update-profile", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin client not configured" });
    }

    try {
      const { userId, updates } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Fetch sample user to detect available columns
      const { data: sampleUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(1)
        .maybeSingle();

      const availableColumns = sampleUser ? Object.keys(sampleUser) : [];
      console.log('Available columns in users table:', availableColumns);

      // Filter updates to columns that actually exist in the DB
      const filteredUpdates: any = {};
      Object.keys(updates).forEach(key => {
        // Map some common variations if needed
        let targetKey = key;
        if (key === 'photoURL' && !availableColumns.includes('photoURL') && availableColumns.includes('avatar')) {
          targetKey = 'avatar';
        }

        if (availableColumns.includes(targetKey)) {
          let val = updates[key];
          // Fix for date fields: if empty string, set to null to avoid invalid input syntax error
          if (targetKey.toLowerCase().includes('date') && val === "") {
            val = null;
          }
          filteredUpdates[targetKey] = val;
        }
      });

      // Ensure updated_at is set if column exists
      if (availableColumns.includes('updated_at')) {
        filteredUpdates.updated_at = new Date().toISOString();
      }

      if (Object.keys(filteredUpdates).length === 0) {
        console.warn('No valid columns to update');
        // If we can't update anything, just return the current user to satisfy the frontend
      }

      console.log('Updating user profile for ID:', userId);
      console.log('Filtered updates:', filteredUpdates);

      // Recursive lookup function to find user by ID or Email
      const findUser = async (id: string) => {
        // Try direct ID only if numeric
        const isNumeric = !isNaN(Number(id)) && !String(id).includes('@') && !String(id).includes('-');
        if (isNumeric) {
          const { data: byId } = await supabaseAdmin.from('users').select('id').eq('id', id).maybeSingle();
          if (byId) return byId;
        }

        // Try Email
        if (String(id).includes('@')) {
          const { data: byEmail } = await supabaseAdmin.from('users').select('id').eq('email', id).maybeSingle();
          if (byEmail) return byEmail;
        }

        // Try Username as fallback
        const { data: byUsername } = await supabaseAdmin.from('users').select('id').eq('username', id).maybeSingle();
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
        console.error('Supabase update error:', updateError);
        throw updateError;
      }
      
      return res.json(data);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Store Routes - Replicating Python logic
  app.get("/api/rankings/colecao", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const limit = parseInt(req.query.limit as string) || 5;
    try {
      // Logic from Python: count user_cards grouped by user_id
      const { data, error } = await supabaseAdmin.rpc('get_collection_ranking', { row_limit: limit });
      
      if (error) {
        // Fallback to JS aggregation if RPC fails/doesn't exist
        const { data: users, error: uError } = await supabaseAdmin.from('users').select('id, username, codename, avatar');
        if (uError) throw uError;
        
        const { data: counts, error: cError } = await supabaseAdmin.rpc('count_user_cards_per_user');
        // This is complex without RPC. Let's try a safer way using select with count.
        
        const ranking = await Promise.all(users.map(async (u) => {
          const { count } = await supabaseAdmin.from('user_cards').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
          return { ...u, total_cards: count || 0 };
        }));
        
        return res.json(ranking.sort((a, b) => b.total_cards - a.total_cards).slice(0, limit));
      }
      
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rankings/ofertas", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const limit = parseInt(req.query.limit as string) || 5;
    try {
      // Grouping in Supabase/PostgREST is often handled via RPC for complex aggregations
      const { data: users, error: uError } = await supabaseAdmin.from('users').select('id, username, codename, avatar');
      if (uError) throw uError;
      
      const ranking = await Promise.all(users.map(async (u) => {
        const { count } = await supabaseAdmin.from('offerlist').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
        return { ...u, offers_count: count || 0 };
      }));
      
      res.json(ranking.sort((a, b) => b.offers_count - a.offers_count).slice(0, limit));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:username/profile", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { username } = req.params;
    const { follower_id } = req.query;
    try {
      // 1. Get user by username or ID
      let query = supabaseAdmin.from('users').select('*');
      if (!isNaN(Number(username))) {
        query = query.eq('id', username);
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
        .select('*, reviewer:users(codename, avatar)')
        .eq('reviewed_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: counters } = await supabaseAdmin
        .from('user_reviews')
        .select('is_positive')
        .eq('reviewed_id', user.id);
      
      const likes = counters?.filter(c => c.is_positive).length || 0;
      const dislikes = counters?.filter(c => !c.is_positive).length || 0;
      const totalReviews = likes + dislikes;
      const approvalRate = totalReviews > 0 ? Math.round((likes / totalReviews) * 100) : null;

      res.json({
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
      });
    } catch (error: any) {
      console.error('Error fetching full user profile:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:username/follow", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { username } = req.params;
    const { follower_id } = req.body;
    try {
      const { data: targetUser } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
      if (!targetUser) return res.status(404).json({ error: "Usuário não encontrado" });

      if (follower_id == targetUser.id) return res.status(400).json({ error: "Você não pode seguir a si mesmo" });

      const { error } = await supabaseAdmin
        .from('user_followers')
        .upsert({ follower_id, followed_id: targetUser.id }, { onConflict: 'follower_id,followed_id' });
      
      if (error) throw error;
      res.json({ message: "Seguindo com sucesso" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:username/unfollow", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { username } = req.params;
    const { follower_id } = req.body;
    try {
      const { data: targetUser } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
      if (!targetUser) return res.status(404).json({ error: "Usuário não encontrado" });

      const { error } = await supabaseAdmin
        .from('user_followers')
        .delete()
        .eq('follower_id', follower_id)
        .eq('followed_id', targetUser.id);
      
      if (error) throw error;
      res.json({ message: "Deixou de seguir" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:username/review", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { username } = req.params;
    const { reviewer_id, is_positive, comment } = req.body;
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
      res.json({ message: "Avaliação registrada" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/atividades", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const limit = parseInt(req.query.limit as string) || 10;
    try {
      // First try action_logs as it was confirmed to exist in codebase
      const { data, error } = await supabaseAdmin
        .from('action_logs')
        .select(`
          id, action, entity, entity_id, details, created_at,
          users:user_id ( id, username, avatar )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Error fetching from action_logs with joins, trying without joins:', error.message);
        const { data: dataLog, error: errorLog } = await supabaseAdmin
          .from('action_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (!errorLog) {
           const formatted = (dataLog || []).map(item => ({
             id: item.id,
             user: 'Usuário',
             userId: item.user_id,
             avatar: null,
             action: item.action || 'fez uma ação',
             target: `${item.entity || ''} ${item.details?.name || ''}`,
             timestamp: new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
             date: new Date(item.created_at).toLocaleDateString('pt-BR')
           }));
           return res.json(formatted);
        }

        console.warn('Error fetching from action_logs completely, trying social_feeds as fallback:', errorLog.message);
        // Fallback or just throw
        const { data: data2, error: error2 } = await supabaseAdmin
          .from('social_feeds')
          .select(`
            id, activity_type, content, target_id, created_at,
            users ( id, username, avatar )
          `)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (error2) throw error2;

        const formatted = (data2 || []).map(item => ({
          id: item.id,
          user: (item.users as any)?.username || 'Usuário',
          userId: (item.users as any)?.id,
          avatar: (item.users as any)?.avatar,
          action: item.activity_type || 'fez uma ação',
          target: item.content || 'algo',
          timestamp: new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(item.created_at).toLocaleDateString('pt-BR')
        }));
        return res.json(formatted);
      }

      const formatted = (data || []).map(item => {
        const user = (item.users as any);
        return {
          id: item.id,
          user: user?.username || 'Usuário',
          userId: user?.id,
          avatar: user?.avatar,
          action: item.action || 'fez uma ação',
          target: `${item.entity} ${item.details?.name || ''}`,
          timestamp: new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(item.created_at).toLocaleDateString('pt-BR')
        };
      });

      res.json(formatted);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/torneios", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    try {
      // First attempt with joins
      const { data, error } = await supabaseAdmin
        .from('tournaments')
        .select(`
          id, name, max_players, start_date, status,
          cardgames ( name ),
          tournament_formats ( name )
        `)
        .order('start_date', { ascending: true });
      
      if (error) {
        console.warn('Error fetching tournaments with joins, falling back to simple select:', error.message);
        const { data: simpleData, error: simpleError } = await supabaseAdmin
          .from('tournaments')
          .select('*')
          .order('start_date', { ascending: true });
        
        if (simpleError) throw simpleError;
        return res.json(simpleData);
      }
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
      res.status(500).json({ error: error.message });
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
      if (!user) return res.status(404).json({ error: "Loja não encontrada" });

      // 2. Get Wishlist size
      const { count: wishlistCount, error: wishError } = await supabaseAdmin
        .from('wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      // 3. Get Store Stock size
      const { count: stockCount, error: stockError } = await supabaseAdmin
        .from('store_stock')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', user.id)
        .gt('quantity', 0);

      res.json({
        user,
        wishlist_size: wishlistCount || 0,
        stock_size: stockCount || 0,
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
      if (!user) return res.status(404).json({ error: "Loja não encontrada" });

      const { data, error } = await supabaseAdmin
        .from('store_stock')
        .select(`
          product_id,
          quantity,
          store_price,
          products (
            id, name, slug, product_type, image_url, beauty_name, mspr, cardgames ( name )
          )
        `)
        .eq('store_id', user.id);
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/lojas/estoque/update", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    try {
      const { store_id, product_id, quantity } = req.body;
      const { data, error } = await supabaseAdmin
        .from('store_stock')
        .upsert({
          store_id,
          product_id,
          quantity
        }, { onConflict: 'store_id,product_id' })
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

      let query = supabaseAdmin.from('products').select('*, cardgames(name)', { count: 'exact' });
      
      if (game) query = query.eq('cardgames.name', game);
      if (type) query = query.eq('product_type', type);

      const { data, count, error } = await query
        .order('product_type', { ascending: false })
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
        .from('products')
        .select('*, cardgames(name)')
        .eq('id', id)
        .maybeSingle();
      
      if (pError) throw pError;
      if (!product) return res.status(404).json({ error: "Produto não encontrado" });

      const { data: stores, error: sError } = await supabaseAdmin
        .from('store_stock')
        .select('quantity, store_price, users(username, codename, avatar)')
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

  app.post("/api/sync-user", async (req: express.Request, res: express.Response) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin client not configured" });
    }

    try {
      const { userData } = req.body;
      if (!userData || !userData.email) {
        return res.status(400).json({ error: "Invalid user data" });
      }

      console.log('Syncing user via backend:', userData.email);

      // Try to find user by email
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const isAdmin = userData.email === 'cardumyapp@gmail.com';

      if (existing) {
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
          // If update fails due to codename uniqueness, try updating without codename
          if (updateError.message?.includes('users_codename_key')) {
             console.warn('Codename conflict, updating without codename');
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
