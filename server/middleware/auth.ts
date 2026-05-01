import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../supabase.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    auth_id: string;
    email?: string;
    username?: string;
    role_id?: number;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const impersonateId = req.headers['x-impersonate-user-id'];

  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  try {
    // If impersonation is requested (and we're not in production)
    if (impersonateId && process.env.NODE_ENV !== 'production') {
        const { data: dbUser, error: dbError } = await supabaseAdmin
          .from('users')
          .select('id, role_id, email, username')
          .eq('id', impersonateId)
          .single();

        if (dbUser) {
            req.user = {
                id: dbUser.id,
                auth_id: 'impersonated',
                email: dbUser.email,
                username: dbUser.username,
                role_id: dbUser.role_id
            };
            return next();
        }
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader?.split(" ")[1];

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      console.error("Auth error from Supabase:", error?.message || "User not found from token");
      throw new Error("Invalid token");
    }

    // Fetch additional user info from our public.users table if needed
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, role_id')
      .eq('email', user.email)
      .single();

    if (dbError || !dbUser) {
        console.error(`User found in Auth (${user.email}) but not in public.users table. Error:`, dbError?.message || 'No dbUser returned');
        return res.status(401).json({ error: "User profile not found in database" });
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
  if (req.user?.role_id !== 6 && req.user?.role_id !== 1) {
    return res.status(403).json({ error: "Access denied: Lojista or Admin role required" });
  }
  next();
};
