import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  // API Proxy for cards (replicating the snippet logic)
  app.get("/api/cards", async (req, res) => {
    try {
      const { game, ...restParams } = req.query;
      
      if (!game) {
        return res.status(400).json({ error: "game obrigatório" });
      }

      const HOMURA_URL = process.env.HOMURA_URL || "https://homura-cards.vercel.app";
      const HOMURA_TOKEN = process.env.HOMURA_TOKEN;

      if (!HOMURA_TOKEN) {
        console.error("HOMURA_TOKEN not found in environment variables");
        return res.status(500).json({ error: "Configuração do servidor incompleta" });
      }

      // Reconstruct query parameters
      const params = new URLSearchParams();
      Object.entries(restParams).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const targetUrl = `${HOMURA_URL}/api/${game}/cards?${params.toString()}`;
      
      console.log(`Proxying request to: ${targetUrl}`);

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${HOMURA_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Error proxying card search:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // API Proxy for Blog (WordPress)
  app.get("/api/blog", async (req, res) => {
    try {
      const perPage = req.query.per_page || 3;
      const targetUrl = `https://cardumy.blog/wp-json/wp/v2/posts?_embed&per_page=${perPage}`;
      
      console.log(`Proxying blog request to: ${targetUrl}`);

      const response = await fetch(targetUrl);
      
      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error proxying blog fetch:", error);
      res.status(500).json({ error: "Erro ao buscar posts do blog" });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
