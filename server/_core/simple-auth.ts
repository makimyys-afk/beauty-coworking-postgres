import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

// Простые тестовые учетные данные
const TEST_USERS = [
  {
    email: "orlova.maria@example.com",
    password: "password",
    openId: "mock-orlova-maria",
    name: "Орлова Мария"
  }
];

export function registerSimpleAuthRoutes(app: Express) {
  // Страница входа
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email и пароль обязательны" });
      return;
    }

    // Проверка учетных данных
    const user = TEST_USERS.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      res.status(401).json({ error: "Неверный email или пароль" });
      return;
    }

    try {
      // Создание или обновление пользователя в БД
      await db.upsertUser({
        openId: user.openId,
        name: user.name,
        email: user.email,
        loginMethod: "simple",
        lastSignedIn: new Date(),
      });

      // Создание сессионного токена
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: { name: user.name, email: user.email } });
    } catch (error) {
      console.error("[SimpleAuth] Login failed", error);
      res.status(500).json({ error: "Ошибка входа" });
    }
  });

  // Выход
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true });
  });

  // Получение текущего пользователя
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: { name: user.name, email: user.email } });
    } catch (error) {
      res.status(401).json({ error: "Не авторизован" });
    }
  });
}
