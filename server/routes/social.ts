import express from "express";
import { supabaseAdmin } from "../supabase.js";
import NodeCache from "node-cache";
import fetch from "node-fetch";

const router = express.Router();
const cache = new NodeCache({ stdTTL: 60 });

router.get("/rankings/colecao", async (req, res) => {
  const admin = supabaseAdmin;
  if (!admin) return res.status(500).json({ error: "Supabase not configured" });
  const limit = parseInt(req.query.limit as string) || 5;
  try {
    const { data: users, error: uError } = await admin.from('users').select('id, username, codename, avatar').neq('role_id', 6);
    if (uError) throw uError;
    const ranking = await Promise.all(users.map(async (u) => {
      const { count } = await admin.from('user_cards').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
      return { ...u, total_cards: count || 0 };
    }));
    res.json(ranking.sort((a, b) => b.total_cards - a.total_cards).slice(0, limit));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/rankings/ofertas", async (req, res) => {
  const admin = supabaseAdmin;
  if (!admin) return res.status(500).json({ error: "Supabase not configured" });
  const limit = parseInt(req.query.limit as string) || 5;
  try {
    const { data: users, error: uError } = await admin.from('users').select('id, username, codename, avatar').neq('role_id', 6);
    if (uError) throw uError;
    const ranking = await Promise.all(users.map(async (u) => {
      const { count } = await admin.from('trade_offers').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
      return { ...u, offers_count: count || 0 };
    }));
    res.json(ranking.sort((a, b) => b.offers_count - a.offers_count).slice(0, limit));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/atividades", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const limit = parseInt(req.query.limit as string) || 10;
  try {
    const { data, error } = await supabaseAdmin.from('action_logs').select('*, users:user_id!inner(username, codename, avatar, role_id)').neq('users.role_id', 6).order('created_at', { ascending: false }).limit(limit);
    if (error || !data?.length) {
      const { data: sData, error: sError } = await supabaseAdmin.from('social_feeds').select('*, users:user_id!inner(username, codename, avatar, role_id)').neq('users.role_id', 6).order('created_at', { ascending: false }).limit(limit);
      if (sError || !sData?.length) return res.json([]);
      return res.json(sData.map(item => ({ id: item.id, user: item.users?.username || item.users?.codename || 'Usuário', avatar: item.users?.avatar, action: item.activity_type, target: item.content, timestamp: new Date(item.created_at).toLocaleTimeString('pt-BR'), date: new Date(item.created_at).toLocaleDateString('pt-BR') })));
    }
    res.json(data.map(item => ({ id: item.id, user: item.users?.username || item.users?.codename || 'Usuário', avatar: item.users?.avatar, action: item.action, target: `${item.entity || ''} ${item.details?.name || ''}`, timestamp: new Date(item.created_at).toLocaleTimeString('pt-BR'), date: new Date(item.created_at).toLocaleDateString('pt-BR') })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/blog-posts", async (req, res) => {
  const perPage = req.query.per_page || 3;
  try {
    const response = await fetch(`https://cardumy.blog/wp-json/wp/v2/posts?per_page=${perPage}&_embed`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
