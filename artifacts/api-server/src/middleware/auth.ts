import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env["JWT_SECRET"] || "default_secret";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });
    
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.id));
    
    if (!user) return res.status(401).json({ error: "User not found" });
    
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  return next();
};
