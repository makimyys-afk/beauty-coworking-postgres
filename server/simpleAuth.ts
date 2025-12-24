import { SignJWT } from "jose";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Response } from "express";

const JWT_SECRET = new TextEncoder().encode(ENV.jwtSecret);

export async function loginWithPassword(email: string, password: string, res: Response) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Найти пользователя по email
  const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (userList.length === 0) {
    throw new Error("Пользователь не найден");
  }
  
  const user = userList[0];
  
  // Проверить пароль
  if (user.password !== password) {
    throw new Error("Неверный пароль");
  }
  
  // Создать JWT токен
  const sessionPayload = {
    openId: user.openId,
    appId: ENV.appId,
    name: user.name || user.email || "",
  };
  
  const jwt = await new SignJWT(sessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(JWT_SECRET);
  
  // Установить cookie
  res.cookie(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: ONE_YEAR_MS,
    path: "/",
  });
  
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      openId: user.openId,
    },
  };
}
