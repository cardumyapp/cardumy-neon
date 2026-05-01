import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import NodeCache from "node-cache";
import fetch from "node-fetch";

// Categories Modular Routes - Static Imports
import { supabaseAdmin } from "./server/supabase.js";
import productsRouter from "./server/routes/products.js";
import storesRouter from "./server/routes/stores.js";
import usersRouter from "./server/routes/users.js";
import socialRouter from "./server/routes/social.js";
import eventsRouter from "./server/routes/events.js";
import ordersRouter from "./server/routes/orders.js";

dotenv.config();

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // Cache for 60 seconds by default

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

  // Request logger - FIRST
  app.use((req, res, next) => {
    // Skip logging for static assets to reduce noise
    const isStatic = req.url.startsWith('/src/') || 
                    req.url.startsWith('/@vite') || 
                    req.url.startsWith('/node_modules/') ||
                    req.url.endsWith('.tsx') ||
                    req.url.endsWith('.ts') ||
                    req.url.endsWith('.css') ||
                    req.url.endsWith('.js');

    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (!isStatic || res.statusCode >= 400) {
        console.log(`${new Date().toISOString()} - [SERVER] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // Global Error Handlers
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
    // In a real prod app, you might want to exit, but here we try to keep going
  });

  app.use(express.json());

  // CORS middleware for iframe environment
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Diagnosis Route
  app.get("/api/health", async (req, res) => {
    let dbStatus = "not_configured";
    let dbDetails: any = null;
    let tables: any = {};

    if (supabaseAdmin) {
      try {
        const { data: users, error: uError } = await supabaseAdmin.from('users').select('id').limit(1);
        if (uError) {
          dbStatus = "error";
          dbDetails = uError;
        } else {
          dbStatus = "connected";
          const tableToProbe = ['users', 'cards', 'cardgames', 'store_stock', 'stores'];
          for (const table of tableToProbe) {
            const { error: probeError } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true }).limit(1);
            tables[table] = probeError ? `Error: ${probeError.message}` : "Exists";
          }
        }
      } catch (err: any) {
        dbStatus = "exception";
        dbDetails = err.message;
      }
    }

    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      supabase: !!supabaseAdmin,
      database_connectivity: dbStatus,
      database_error: dbDetails,
      tables
    });
  });

  // Basic API Routes
  app.get("/api/ping", (req, res) => {
    res.json({ status: "pong", time: new Date().toISOString() });
  });

  app.use("/api", productsRouter);
  app.use("/api", storesRouter);
  app.use("/api", usersRouter);
  app.use("/api", socialRouter);
  app.use("/api", eventsRouter);
  app.use("/api", ordersRouter);

  // 404 for API routes
  app.use('/api', (req, res) => {
    console.warn(`404 API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `The requested API route ${req.method} ${req.url} was not found on this server.` });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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
    console.log(`${new Date().toISOString()} - [SERVER] Started listening on 0.0.0.0:${PORT}`);
    console.log(`Supabase Admin configured: ${!!supabaseAdmin}`);
    console.log(`Supabase URL presence: ${!!process.env.VITE_SUPABASE_URL}`);
    console.log(`Supabase Service Role Key presence: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
  });
  } catch (error) {
    console.error("CRITICAL: Server failed to start:", error);
  }
}

startServer();
