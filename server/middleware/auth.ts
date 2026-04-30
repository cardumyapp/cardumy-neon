import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../supabase.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    auth_id: string;
    email?: string;
    role_id?: number;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) throw new Error("Invalid token");

    // Fetch additional user info from our public.users table if needed
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id, role_id')
      .eq('email', user.email)
      .single();

    if (!dbUser) {
        console.error(`User found in Auth but not in public.users table: ${user.email}`);
        return res.status(401).json({ error: "User profile not found" });
    }

    req.user = {
      id: dbUser.id,           // Integer ID from public.users
      auth_id: user.id,        // UUID from auth.users
      email: user.email,
      role_id: dbUser.role_id
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const requireLojista = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role_id !== 6) {
    return res.status(403).json({ error: "Access denied: Lojista role required" });
  }
  next();
};
