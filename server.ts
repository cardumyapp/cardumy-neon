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
          .maybeSingle();
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
