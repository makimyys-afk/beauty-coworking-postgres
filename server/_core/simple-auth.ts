import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import crypto from "crypto";

// Простые тестовые учетные данные
const TEST_USERS = [
  {
    email: "orlova.maria@example.com",
    password: "password",
    openId: "mock-orlova-maria",
    name: "Орлова Мария"
  }
];

// Хранилище зарегистрированных пользователей
const REGISTERED_USERS = new Map<string, { email: string; password: string; openId: string; name: string; phone?: string }>();

// Инициализация с тестовым пользователем
REGISTERED_USERS.set("orlova.maria@example.com", {
  email: "orlova.maria@example.com",
  password: "password",
  openId: "mock-orlova-maria",
  name: "Орлова Мария"
});

// Инициализация админа
REGISTERED_USERS.set("admin@beauty-coworking.ru", {
  email: "admin@beauty-coworking.ru",
  password: "admin123",
  openId: "admin-user",
  name: "Администратор"
});

export function registerSimpleAuthRoutes(app: Express) {
  // Страница входа
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email и пароль обязательны" });
      return;
    }

    // Проверка учетных данных в зарегистрированных пользователях
    const user = REGISTERED_USERS.get(email);
    
    if (!user || user.password !== password) {
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
        role: user.openId === "admin-user" ? "admin" : "user",
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

  // Регистрация нового пользователя
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, пароль и имя обязательны" });
      return;
    }

    // Проверка, что пользователь еще не зарегистрирован
    if (REGISTERED_USERS.has(email)) {
      res.status(400).json({ error: "Пользователь с таким email уже существует" });
      return;
    }

    try {
      // Генерация уникального openId
      const openId = `user-${crypto.randomBytes(16).toString("hex")}`;

      // Сохранение пользователя в памяти
      REGISTERED_USERS.set(email, {
        email,
        password,
        openId,
        name,
        phone
      });

      // Создание пользователя в БД
      const dbUser = await db.upsertUser({
        openId,
        name,
        email,
        phone,
        loginMethod: "simple",
        lastSignedIn: new Date(),
      });

      // Создание начальной транзакции на 5000₽
      await db.createTransaction({
        userId: dbUser.id,
        type: "deposit",
        amount: 5000,
        status: "completed",
        description: "Стартовый бонус при регистрации"
      });

      // Создание сессионного токена
      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: { name, email }, balance: 5000 });
    } catch (error) {
      console.error("[SimpleAuth] Registration failed", error);
      // Откат регистрации в памяти в случае ошибки
      REGISTERED_USERS.delete(email);
      res.status(500).json({ error: "Ошибка регистрации" });
    }
  });
}
