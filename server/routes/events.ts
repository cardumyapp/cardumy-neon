import express from "express";
import { supabaseAdmin } from "../supabase.js";
import { authenticate, requireLojista } from "../middleware/auth.js";
import { randomBytes } from "crypto";

const router = express.Router();

const generateTicket = () => {
    return randomBytes(4).toString('hex'); // 8 characters
};

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

// Search by ticket
router.get("/torneios/busca", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { ticket } = req.query;
    if (!ticket) return res.status(400).json({ error: "Ticket is required" });

    try {
        const { data, error } = await supabaseAdmin
            .from('tournaments')
            .select(`id, name, ticket, cardgame_id, status`)
            .eq('ticket', ticket)
            .maybeSingle();
        
        if (error) throw error;
        if (!data) return res.status(404).json({ error: "Torneio não encontrado" });

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// User's own tournaments
router.get("/meus-torneios", authenticate, requireLojista, async (req: any, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    try {
        const { data, error } = await supabaseAdmin
            .from('tournaments')
            .select(`*, cardgame:cardgames(name), format:tournament_formats(name)`)
            .eq('created_by', req.user.id)
            .order('start_date', { ascending: false });
        
        if (error) throw error;
        res.json((data || []).map(t => ({ ...t, cardgames: (t as any).cardgame, tournament_formats: (t as any).format })));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/torneios/:id", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    try {
        const { data, error } = await supabaseAdmin
            .from('tournaments')
            .select(`*, cardgame:cardgames(name), format:tournament_formats(name)`)
            .eq('id', req.params.id)
            .single();
        
        if (error) throw error;
        res.json({ ...data, cardgames: (data as any).cardgame, tournament_formats: (data as any).format });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/torneios", authenticate, requireLojista, async (req: any, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    try {
        const { name, cardgame_id, format_id, max_players, start_date, status, top1, top2, top3 } = req.body;
        const ticket = generateTicket();

        const tournamentData: any = {
            name,
            cardgame_id,
            format_id,
            max_players,
            start_date,
            status: status || 'open',
            created_by: req.user.id,
            ticket
        };

        if (status === 'finished') {
            tournamentData.top1 = top1 || null;
            tournamentData.top2 = top2 || null;
            tournamentData.top3 = top3 || null;
        }

        const { data, error } = await supabaseAdmin
            .from('tournaments')
            .insert(tournamentData)
            .select()
            .single();
        
        if (error) throw error;

        // If finished, we could create notifications here like in the legacy code
        if (status === 'finished' && (top1 || top2 || top3)) {
            const tops = [
                { id: top1, place: "1º lugar" },
                { id: top2, place: "2º lugar" },
                { id: top3, place: "3º lugar" }
            ].filter(t => t.id);

            for (const top of tops) {
                await supabaseAdmin.from('notifications').insert({
                    user_id: top.id,
                    type: "tournament_result",
                    message: `Você ficou em ${top.place} no torneio ${name}. Envie sua decklist.`,
                    url: `/torneios/${data.id}/decklist`,
                    is_read: false
                });
            }
        }

        res.json({ status: "ok", id: data.id, ticket });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/torneios/:id/iniciar", authenticate, requireLojista, async (req: any, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    try {
        // Simple validation check: ensure it belongs to user
        const { data: tourney } = await supabaseAdmin
            .from('tournaments')
            .select('created_by')
            .eq('id', req.params.id)
            .single();
        
        if (!tourney || tourney.created_by !== req.user.id) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const now = new Date().toLocaleTimeString('pt-BR', { hour12: false });
        const { data, error } = await supabaseAdmin
            .from('tournaments')
            .update({ 
                start_time: now, 
                status: 'in_progress' 
            })
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;
        res.json({ status: "ok", start_time: data.start_time, status_updated: data.status });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/torneios/:id/entries", authenticate, requireLojista, async (req: any, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    try {
        const { id } = req.params;
        const { data, error } = await supabaseAdmin
            .from('tournament_entries')
            .select(`*, user:users(id, username, display_name, avatar_url)`)
            .eq('tournament_id', id);
        
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/torneios/entries/:entryId/points", authenticate, requireLojista, async (req: any, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { entryId } = req.params;
    const { points } = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('tournament_entries')
            .update({ points })
            .eq('id', entryId)
            .select()
            .single();
        
        if (error) throw error;
        res.json({ ok: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/torneios/entries/:entryId/status", authenticate, requireLojista, async (req: any, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { entryId } = req.params;
    const { status } = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('tournament_entries')
            .update({ status })
            .eq('id', entryId)
            .select()
            .single();
        
        if (error) throw error;
        res.json({ ok: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/torneios/:id/finalizar", authenticate, requireLojista, async (req: any, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { id } = req.params;
    const { top1, top2, top3 } = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('tournaments')
            .update({
                status: 'finished',
                top1: top1 || null,
                top2: top2 || null,
                top3: top3 || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;

        // Notifications
        const tops = [
            { id: top1, place: "1º lugar" },
            { id: top2, place: "2º lugar" },
            { id: top3, place: "3º lugar" }
        ].filter(t => t.id);

        for (const top of tops) {
            await supabaseAdmin.from('notifications').insert({
                user_id: top.id,
                type: "tournament_result",
                message: `Você ficou em ${top.place} no torneio ${data.name}. Envie sua decklist.`,
                url: `/torneios/${data.id}/decklist`,
                is_read: false
            });
        }

        res.json({ ok: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
