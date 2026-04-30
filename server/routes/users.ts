import express from "express";
import { supabaseAdmin } from "../supabase.js";

const router = express.Router();

router.post("/update-profile", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Admin not configured" });
  try {
    const { userId, updates } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const allowedFields = ['username', 'codename', 'avatar', 'banner_url', 'favorite_cardgame_id', 'gender', 'birth_date', 'phone', 'fighter_tags', 'bio', 'updated_at'];
    const filteredUpdates: any = {};
    Object.keys(updates).forEach(key => {
      let targetKey = key;
      if (key === 'photoURL' || key === 'avatar') targetKey = 'avatar';
      if (key === 'cover_url' || key === 'banner_url') targetKey = 'banner_url';
      if (key === 'favorite_game' || key === 'favorite_cardgame_id') targetKey = 'favorite_cardgame_id';

      if (allowedFields.includes(targetKey)) {
        let val = updates[key];
        if ((targetKey === 'birth_date' || targetKey === 'favorite_cardgame_id') && val === "") {
          val = null;
        } else if (targetKey === 'favorite_cardgame_id' && val !== null) {
          const num = Number(val);
          val = !isNaN(num) ? num : null;
        }
        if (targetKey === 'fighter_tags' && Array.isArray(val)) {
          val = val.join(', ');
        }
        filteredUpdates[targetKey] = val;
      }
    });

    if (Object.keys(filteredUpdates).length === 0) return res.status(400).json({ error: "No valid information provided" });
    filteredUpdates.updated_at = new Date().toISOString();

    const admin = supabaseAdmin!;

    const findUser = async (id: string) => {
      const { data: byId } = await admin.from('users').select('id').eq('id', id).maybeSingle();
      if (byId) return byId;
      if (id.includes('@')) {
        const { data: byEmail } = await admin.from('users').select('id').eq('email', id).maybeSingle();
        if (byEmail) return byEmail;
      }
      const { data: byUsername } = await admin.from('users').select('id').eq('username', id).maybeSingle();
      return byUsername;
    };

    const targetUser = await findUser(userId);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    const { data, error: updateError } = await supabaseAdmin
      .from('users')
      .update(filteredUpdates)
      .eq('id', targetUser.id)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    return res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: "Erro interno no servidor", details: error.message });
  }
});

router.get("/users/:username/profile", async (req, res) => {
  const { username } = req.params;
  const { follower_id } = req.query;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  try {
    let query = supabaseAdmin.from('users').select('*, cardgames(id, name)');
    if (!isNaN(Number(username)) && !username.includes('@')) query = query.eq('id', username);
    else if (username.includes('@')) query = query.eq('email', username);
    else query = query.eq('username', username);
    
    const { data: user, error: userError } = await query.maybeSingle();
    if (userError) throw userError;
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    let isFollowing = false;
    if (follower_id) {
      const { data: followDoc } = await supabaseAdmin
        .from('user_followers')
        .select('*')
        .eq('follower_id', follower_id as string)
        .eq('followed_id', user.id)
        .maybeSingle();
      isFollowing = !!followDoc;
    }

    const { count: collectionCount } = await supabaseAdmin.from('user_cards').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: wishlistCount } = await supabaseAdmin.from('wishlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: offerCount } = await supabaseAdmin.from('offerlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: followersCount } = await supabaseAdmin.from('user_followers').select('*', { count: 'exact', head: true }).eq('followed_id', user.id);
    const { count: followingCount } = await supabaseAdmin.from('user_followers').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);

    const { data: reviews } = await supabaseAdmin
      .from('user_reviews')
      .select('id, comment, is_positive, created_at, reviewer:users!reviewer_id(codename, avatar)')
      .eq('reviewed_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: counters } = await supabaseAdmin.from('user_reviews').select('is_positive').eq('reviewed_id', user.id);
    const likes = counters?.filter(c => c.is_positive).length || 0;
    const dislikes = counters?.filter(c => !c.is_positive).length || 0;

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
        total_reviews: likes + dislikes,
        approval_rate: (likes + dislikes) > 0 ? Math.round((likes / (likes + dislikes)) * 100) : null
      },
      reviews: reviews || []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/users/:username/follow", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { username } = req.params;
  const { follower_id } = req.body;
  if (!follower_id) return res.status(400).json({ error: "Follower ID is required" });

  try {
    const { data: targetUser } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
    if (!targetUser) return res.status(404).json({ error: "Usuário não encontrado" });
    if (follower_id == targetUser.id) return res.status(400).json({ error: "No self-follow" });

    const { error } = await supabaseAdmin.from('user_followers').upsert({ follower_id, followed_id: targetUser.id });
    if (error) throw error;
    res.json({ message: "Seguindo com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/users/:username/unfollow", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { username } = req.params;
  const { follower_id } = req.body;
  try {
    const { data: targetUser } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
    if (!targetUser) return res.status(404).json({ error: "Usuário não encontrado" });
    const { error } = await supabaseAdmin.from('user_followers').delete().eq('follower_id', follower_id).eq('followed_id', targetUser.id);
    if (error) throw error;
    res.json({ message: "Deixou de seguir" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/users/:username/review", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { username } = req.params;
  const { reviewer_id, is_positive, comment } = req.body;
  try {
    const { data: targetUser } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
    if (!targetUser) return res.status(404).json({ error: "Usuário não encontrado" });
    const { error } = await supabaseAdmin.from('user_reviews').upsert({ reviewer_id, reviewed_id: targetUser.id, is_positive, comment: comment?.slice(0, 255), created_at: new Date().toISOString() });
    if (error) throw error;
    res.json({ message: "Avaliação registrada" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/sync-user", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Admin not configured" });
  try {
    const { userData } = req.body;
    if (!userData?.email) return res.status(400).json({ error: "Invalid user data" });
    const { data: existing } = await supabaseAdmin.from('users').select('*').eq('email', userData.email).maybeSingle();
    const isAdmin = userData.email === 'cardumyapp@gmail.com';
    if (existing) {
      const { data, error } = await supabaseAdmin.from('users').update({ avatar: userData.photoURL || existing.avatar, codename: userData.displayName || existing.codename, role_id: isAdmin ? 1 : (existing.role_id || 7), updated_at: new Date().toISOString() }).eq('id', existing.id).select().maybeSingle();
      if (error) throw error;
      return res.json(data);
    } else {
      const baseUsername = (userData.displayName || 'user').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabaseAdmin.from('users').insert({ username, codename: userData.displayName || username, email: userData.email, password: 'social-login', avatar: userData.photoURL || null, vip: false, role_id: isAdmin ? 1 : 7 }).select().maybeSingle();
      if (error) throw error;
      return res.json(data);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/search-users", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { q } = req.query;
  try {
    const { data, error } = await supabaseAdmin.from('users').select('id, username, codename, avatar, role_id').neq('role_id', 6).or(`username.ilike.%${q}%,codename.ilike.%${q}%`).limit(10);
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/user/address/primary", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  try {
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) throw new Error("User not found");
    const { data, error } = await supabaseAdmin.from('user_addresses').select('*').eq('user_id', user.id).eq('is_primary', true) .maybeSingle();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
