import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleAiKey = process.env.GOOGLE_AI_ROLE_KEY;

if (!supabaseUrl) console.warn("[WARN] VITE_SUPABASE_URL is missing in environment variables.");
if (!supabaseServiceKey) console.warn("[WARN] SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.");

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export const supabaseAI = (supabaseUrl && googleAiKey)
  ? createClient(supabaseUrl, googleAiKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

if (supabaseAdmin) {
  console.log("[INFO] Supabase Admin initialized successfully.");
}

if (supabaseAI) {
  console.log("[INFO] Supabase Google AI client initialized successfully.");
}
