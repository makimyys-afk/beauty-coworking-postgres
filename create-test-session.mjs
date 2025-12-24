import { SignJWT } from "jose";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const VITE_APP_ID = process.env.VITE_APP_ID || "beauty-coworking";

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not set in .env");
  process.exit(1);
}

async function createTestSession() {
  const openId = "mock-orlova-maria";
  const name = "Орлова Мария";
  const appId = VITE_APP_ID;

  const issuedAt = Date.now();
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);
  const secretKey = new TextEncoder().encode(JWT_SECRET);

  const token = await new SignJWT({
    openId,
    appId,
    name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);

  console.log("\n=== Test Session Token ===");
  console.log("User:", name);
  console.log("OpenID:", openId);
  console.log("\nSession Token:");
  console.log(token);
  console.log("\n=== Cookie Value ===");
  console.log(`manus-session=${token}`);
  console.log("\nУстановите этот cookie в браузере для автоматического входа.");
}

createTestSession().catch(console.error);
