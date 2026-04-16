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
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin client not configured" });
    }

    try {
      console.log('Starting database seed from server...');

      // 1. Seed Roles
      const { data: roles, error: rolesError } = await supabaseAdmin
        .from('roles')
        .upsert([
          { id: 1, name: 'Administrador', slug: 'admin', description: 'Acesso total ao sistema' },
          { id: 7, name: 'Membro', slug: 'member', description: 'Papel padrão para todos usuários' }
        ], { onConflict: 'slug' })
        .select();
      if (rolesError) throw rolesError;

      // 2. Seed Card Games
      const { data: games, error: gamesError } = await supabaseAdmin
        .from('cardgames')
        .upsert([
          { id: 1, name: 'One Piece', slug: 'one-piece' },
          { id: 2, name: 'Digimon', slug: 'digimon' },
          { id: 3, name: 'Pokémon', slug: 'pokemon' },
          { id: 4, name: 'Magic The Gathering', slug: 'magic' },
          { id: 9, name: 'Yu-Gi-Oh!', slug: 'yu-gi-oh' }
        ], { onConflict: 'slug' })
        .select();
      if (gamesError) throw gamesError;

      // 3. Seed Admin User
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .upsert([
          { 
            username: 'admin', 
            codename: 'Admin Cardumy', 
            email: 'admin@cardumy.com', 
            password: 'hashed_password_here', 
            role_id: 1 
          }
        ], { onConflict: 'username' })
        .select();
      if (usersError) throw usersError;
      const adminId = users[0].id;

      // 4. Seed Stores
      const { data: stores, error: storesError } = await supabaseAdmin
        .from('stores')
        .upsert([
          { user_id: adminId, name: 'Loja do Caos', slug: 'lojadocaos', estado: 'SP', cidade: 'São Paulo', venda_habilitada: true },
          { user_id: adminId, name: 'Matrona TCG', slug: 'matronatcg', estado: 'SP', cidade: 'São Paulo', venda_habilitada: true }
        ], { onConflict: 'slug' })
        .select();
      if (storesError) throw storesError;

      // 5. Seed Products
      const pokemonGame = games?.find(g => g.slug === 'pokemon');
      const onePieceGame = games?.find(g => g.slug === 'one-piece');

      const { error: productsError } = await supabaseAdmin
        .from('products')
        .upsert([
          { 
            game_id: pokemonGame?.id, 
            name: 'Pikachu VMAX', 
            slug: 'pikachu-vmax', 
            product_type: 'Carta Avulsa', 
            image_url: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=300' 
          },
          { 
            game_id: onePieceGame?.id, 
            name: 'Monkey.D.Luffy', 
            slug: 'monkey-d-luffy-st01', 
            product_type: 'Starter Deck', 
            image_url: 'https://en.onepiece-cardgame.com/images/products/decks/st01-04/img_thumbnail_st01.png' 
          }
        ], { onConflict: 'slug' });
      if (productsError) throw productsError;

      res.json({ message: "Database seeded successfully" });
    } catch (error: any) {
      console.error('Error seeding database:', error);
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
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const isAdmin = userData.email === 'cardumyapp@gmail.com';

      if (existing) {
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
          .single();
        if (updateError) throw updateError;
        return res.json(data);
      } else {
        const { data, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            username: (userData.displayName || 'user').split(' ')[0].toLowerCase() + Math.floor(Math.random() * 1000),
            codename: userData.displayName || 'User',
            email: userData.email,
            password: 'social-login', // Placeholder
            avatar: userData.photoURL || null,
            vip: false,
            role_id: isAdmin ? 1 : 7
          })
          .select()
          .single();
        if (insertError) throw insertError;
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
