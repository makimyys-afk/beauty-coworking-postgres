import type { Express, Request, Response, NextFunction } from "express";
import * as db from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "beauty-coworking-secret-key-2024";
const COOKIE_NAME = "session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

interface JWTPayload {
  userId: number;
  openId: string;
  email: string;
  name: string;
}

// Middleware для проверки авторизации
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[COOKIE_NAME];
    
    if (!token) {
      console.log("[Auth] Missing session cookie");
      return res.status(401).json({ error: "Не авторизован" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Добавляем информацию о пользователе в request
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    console.error("[Auth] Token verification failed:", error);
    res.status(401).json({ error: "Недействительная сессия" });
  }
}

export function registerSimpleAuthRoutes(app: Express) {
  // Страница входа
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: "Email и пароль обязательны" });
      return;
    }

    try {
      // Получить пользователя из базы данных по email
      const user = await db.getUserByEmail(email);

      if (!user) {
        res.status(401).json({ error: "Неверный email или пароль" });
        return;
      }

      // Проверить пароль из базы данных
      if (user.password && user.password !== password) {
        res.status(401).json({ error: "Неверный email или пароль" });
        return;
      }

      // Обновить время последнего входа
      await db.updateUserLastSignedIn(user.id);

      // Создание JWT токена
      const payload: JWTPayload = {
        userId: user.id,
        openId: user.openId,
        email: user.email || "",
        name: user.name || user.email || "User"
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '365d' });

      // Установить cookie
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: ONE_YEAR_MS,
        path: '/'
      });
      
      res.json({ 
        success: true, 
        user: { 
          id: user.id,
          name: user.name, 
          email: user.email,
          openId: user.openId 
        } 
      });
    } catch (error) {
      console.error("[SimpleAuth] Login failed", error);
      res.status(500).json({ error: "Ошибка входа" });
    }
  });

  // Выход
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ success: true });
  });

  // Получение текущего пользователя
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const token = req.cookies[COOKIE_NAME];
      
      if (!token) {
        return res.status(401).json({ error: "Не авторизован" });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      // Получаем полные данные пользователя из БД
      const dbUser = await db.getUserByOpenId(decoded.openId);
      
      if (!dbUser) {
        res.status(404).json({ error: "Пользователь не найден" });
        return;
      }
      
      res.json({ 
        user: { 
          id: dbUser.id,
          openId: dbUser.openId,
          name: dbUser.name, 
          email: dbUser.email,
          role: dbUser.role,
          status: dbUser.status,
          points: dbUser.points
        } 
      });
    } catch (error) {
      console.error("[Auth] Get me failed:", error);
      res.status(401).json({ error: "Не авторизован" });
    }
  });

  // Регистрация нового пользователя
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name, phone, specialization } = req.body;
    
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, пароль и имя обязательны" });
      return;
    }

    try {
      // Проверка существующего пользователя
      const existingUser = await db.getUserByEmail(email);

      if (existingUser) {
        res.status(400).json({ error: "Пользователь с таким email уже существует" });
        return;
      }

      // Генерация уникального openId
      const openId = `user-${crypto.randomBytes(16).toString("hex")}`;

      // Создание пользователя в БД
      const dbUser = await db.upsertUser({
        openId,
        name,
        email,
        phone: phone || null,
        specialization: specialization || null,
        loginMethod: "simple",
        lastSignedIn: new Date(),
      });

      // Установить пароль
      const dbInstance = await db.getDb();
      if (dbInstance) {
        await dbInstance.update(users).set({ password }).where(eq(users.id, dbUser.id));
      }

      // Создание начальной транзакции
      await db.createTransaction({
        userId: dbUser.id,
        type: "deposit",
        amount: 5000,
        status: "completed",
        description: "Стартовый бонус при регистрации"
      });

      // Создание JWT токена
      const payload: JWTPayload = {
        userId: dbUser.id,
        openId,
        email,
        name
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '365d' });

      // Установить cookie
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: ONE_YEAR_MS,
        path: '/'
      });
      
      res.json({ success: true, user: { name, email }, balance: 5000 });
    } catch (error) {
      console.error("[SimpleAuth] Registration failed", error);
      res.status(500).json({ error: "Ошибка регистрации" });
    }
  });
}
