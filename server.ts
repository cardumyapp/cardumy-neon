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

      let HOMURA_URL = process.env.HOMURA_URL || "https://homura-cards.vercel.app";
      const HOMURA_TOKEN = process.env.HOMURA_TOKEN;

      if (!HOMURA_TOKEN) {
        console.warn("HOMURA_TOKEN not found in environment variables - proxying without token");
      }

      // Ensure HOMURA_URL doesn't end with a slash
      HOMURA_URL = HOMURA_URL.replace(/\/$/, "");

      // Reconstruct query parameters
      const params = new URLSearchParams();
      Object.entries(restParams).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const targetUrl = `${HOMURA_URL}/api/${game}/cards?${params.toString()}`;
      
      console.log(`[Proxy] Request to: ${targetUrl}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // Increased to 20s for slower external APIs

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Cardumy-TCG/1.0.0 (Node.js Proxy)"
      };

      if (HOMURA_TOKEN) {
        headers["Authorization"] = `Bearer ${HOMURA_TOKEN}`;
      }

      let response;
      try {
        response = await fetch(targetUrl, {
          method: 'GET',
          headers,
          signal: controller.signal
        });
      } catch (error: any) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
          console.error(`[Proxy] Timeout fetching ${targetUrl}`);
          return res.status(504).json({ error: "Timeout ao buscar cartas externas (API demorou mais de 20s)" });
        }
        console.error(`[Proxy] Fetch error for ${targetUrl}:`, error);
        return res.status(500).json({ error: "Erro na conexão com API externa" });
      }

      clearTimeout(timeout);

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        res.status(response.status).json(data);
      } else {
        const text = await response.text();
        console.error(`External API returned non-JSON response from ${targetUrl}:`, text.substring(0, 500));
        res.status(response.status).send(text);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("Proxy request timed out");
        return res.status(504).json({ error: "Gateway Timeout" });
      }
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

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Cardumy-TCG/1.0.0 (Node.js Proxy)"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("Blog proxy request timed out");
        return res.status(504).json({ error: "Blog Timeout" });
      }
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
    // Express v5 requires *all for catch-all
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
