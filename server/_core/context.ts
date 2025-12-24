import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import jwt from "jsonwebtoken";
import * as db from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "beauty-coworking-secret-key-2024";
const COOKIE_NAME = "session";

interface JWTPayload {
  userId: number;
  openId: string;
  email: string;
  name: string;
}

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  
  try {
    const token = opts.req.cookies[COOKIE_NAME];
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      // Получаем пользователя из БД
      const dbUser = await db.getUserByOpenId(decoded.openId);
      
      if (dbUser) {
        user = dbUser as User;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.log("[Auth] Failed to authenticate request:", error);
    user = null;
  }
  
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
