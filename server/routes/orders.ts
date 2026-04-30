import express from "express";
import { supabaseAdmin } from "../supabase.js";
import { authenticate, requireLojista } from "../middleware/auth.js";

const router = express.Router();

// Get order history for the current user
router.get("/orders", authenticate, async (req: any, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    product:products(*)
                ),
                store:stores(name)
            `)
            .eq('buyer_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get received orders for a store (Lojista)
router.get("/orders/received", authenticate, requireLojista, async (req: any, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    try {
        // 1. Find store id for this user
        const { data: store } = await supabaseAdmin
            .from('stores')
            .select('id')
            .eq('user_id', req.user.id)
            .single();
        
        if (!store) return res.status(404).json({ error: "Store not found" });

        const { data, error } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                buyer:users(id, username, codename, avatar),
                order_items (
                    *,
                    product:products(*)
                )
            `)
            .eq('store_id', store.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single order detail
router.get("/orders/:id", authenticate, async (req: any, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { id } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    product:products(*)
                ),
                store:stores(name),
                buyer:users(id, username, codename, avatar, email)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status (Lojista or Buyer if applicable)
router.post("/orders/:id/status", authenticate, async (req: any, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    const { status } = req.body;
    const { id } = req.params;

    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Job to expire orders (Simulated call on certain actions or dedicated endpoint)
router.post("/orders/cleanup", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    
    try {
        const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        // 1. Find pending orders older than 24h
        const { data: expiredOrders, error: findError } = await supabaseAdmin
            .from('orders')
            .select('id, store_id')
            .eq('status', 'pending')
            .lt('created_at', expirationTime);

        if (findError) throw findError;

        for (const order of (expiredOrders || [])) {
            // Get items to return stock
            const { data: items } = await supabaseAdmin
                .from('order_items')
                .select('product_id, quantity')
                .eq('order_id', order.id);

            for (const item of (items || [])) {
                // Update stock back
                const { data: stock } = await supabaseAdmin
                    .from('store_stock')
                    .select('id, quantity')
                    .eq('product_id', item.product_id)
                    .eq('store_id', order.store_id)
                    .maybeSingle();

                if (stock) {
                    await supabaseAdmin
                        .from('store_stock')
                        .update({ quantity: stock.quantity + item.quantity })
                        .eq('id', stock.id);
                }
            }

            // Mark as expired
            await supabaseAdmin
                .from('orders')
                .update({ status: 'expired' })
                .eq('id', order.id);
        }

        res.json({ ok: true, expiredCount: expiredOrders?.length || 0 });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/checkout", authenticate, async (req: any, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
    
    const { items, address_id } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Carrinho vazio" });
    }

    try {
        // 1. Transaction-like operation (Manual since we use simple DB calls)
        // Check availability of each item
        for (const item of items) {
            // Check if it's a ticket
            const { data: ticketData } = await supabaseAdmin
                .from('tournament_tickets')
                .select('*')
                .eq('product_id', item.product_id)
                .maybeSingle();
            
            if (ticketData) {
                const now = new Date().toISOString();
                if (!ticketData.is_active) {
                    return res.status(400).json({ error: `Ingresso para "${item.name}" não está ativo` });
                }
                if (now < ticketData.sale_start || now > ticketData.sale_end) {
                    return res.status(400).json({ error: `Venda de ingressos para "${item.name}" encerrada ou não iniciada` });
                }
                if (ticketData.sold_quantity + item.quantity > ticketData.max_quantity) {
                    return res.status(400).json({ error: `Ingresso para "${item.name}" esgotado` });
                }
            } else {
                // Check normal stock
                const { data: stock } = await supabaseAdmin
                    .from('store_stock')
                    .select('quantity')
                    .eq('product_id', item.product_id)
                    .eq('store_id', item.store_id)
                    .single();
                
                if (!stock || stock.quantity < item.quantity) {
                    return res.status(400).json({ error: `Produto "${item.name}" sem estoque suficiente` });
                }
            }
        }

        // 2. Create Order
        const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const externalRef = `ORD-${Date.now()}-${userId}`;
        
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                buyer_id: userId,
                amount: total,
                status: 'pending',
                store_id: items[0]?.store_id || null, // Best effort: pick first store if mixed (ideally checkout is per store)
                external_reference: externalRef,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (orderError) throw orderError;

        // 3. Create Order Items and Update Stock/Sold count
        for (const item of items) {
            await supabaseAdmin.from('order_items').insert({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.price
            });

            // Check if it's a ticket again to update sold_quantity
            const { data: ticketData } = await supabaseAdmin
                .from('tournament_tickets')
                .select('id, sold_quantity')
                .eq('product_id', item.product_id)
                .maybeSingle();
            
            if (ticketData) {
                const { data: updatedTicket } = await supabaseAdmin
                    .from('tournament_tickets')
                    .update({ sold_quantity: ticketData.sold_quantity + item.quantity })
                    .eq('id', ticketData.id)
                    .select()
                    .single();
                
                // Update normal stock as well
                const { data: stock } = await supabaseAdmin
                    .from('store_stock')
                    .select('id, quantity')
                    .eq('product_id', item.product_id)
                    .eq('store_id', item.store_id)
                    .maybeSingle();
                
                if (stock) {
                    await supabaseAdmin
                        .from('store_stock')
                        .update({ quantity: Math.max(0, stock.quantity - item.quantity) })
                        .eq('id', stock.id);
                }

                // Create entry in tournament_entries automatically
                const { data: ticketDetail } = await supabaseAdmin
                    .from('tournament_tickets')
                    .select('tournament_id')
                    .eq('id', ticketData.id)
                    .single();
                
                if (ticketDetail) {
                    await supabaseAdmin.from('tournament_entries').insert({
                        tournament_id: ticketDetail.tournament_id,
                        user_id: userId,
                        status: 'paid',
                        points: 0,
                        created_at: new Date().toISOString()
                    });
                }
            } else {
                // Normal stock update
                const { data: stock } = await supabaseAdmin
                    .from('store_stock')
                    .select('id, quantity')
                    .eq('product_id', item.product_id)
                    .eq('store_id', item.store_id)
                    .maybeSingle();

                if (stock) {
                    await supabaseAdmin
                        .from('store_stock')
                        .update({ quantity: Math.max(0, stock.quantity - item.quantity) })
                        .eq('id', stock.id);
                }
            }
        }

        res.json({ ok: true, order_id: order.id });
    } catch (error: any) {
        console.error("Erro no checkout:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
