import express from "express";
import { supabaseAdmin } from "../supabase.js";

const router = express.Router();

router.get("/torneios", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { data, error } = await supabaseAdmin.from('tournaments').select(`*, cardgame:cardgames(name), format:tournament_formats(name)` ).order('start_date', { ascending: true });
    if (error) {
      const { data: simpleData } = await supabaseAdmin.from('tournaments').select('*').order('start_date', { ascending: true });
      return res.json(simpleData);
    }
    res.json((data || []).map(t => ({ ...t, cardgames: (t as any).cardgame, tournament_formats: (t as any).format })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
