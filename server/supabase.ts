import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

if (supabaseAdmin) {
  console.log("[INFO] Supabase Admin initialized successfully.");
} else {
  console.error("[ERROR] Supabase Admin failed to initialize. Check your environment variables.");
}
