import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, workspaces } from "./drizzle/schema.js";

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

console.log("Seeding database...");

// Insert test user
await db.insert(users).values({
  openId: "test_user_123",
  name: "Тестовый Пользователь",
  email: "test@example.com",
  role: "user",
  status: "bronze",
  points: 0
});

// Insert workspaces
await db.insert(workspaces).values([
  {
    name: "Парикмахерское место №1",
    description: "Современное рабочее место для парикмахера с профессиональным оборудованием",
    type: "hairdresser",
    pricePerHour: 50000,
    pricePerDay: 350000,
    imageUrl: "/workspaces/hairdresser-1.jpg",
    amenities: JSON.stringify(["Фен", "Утюжок", "Плойка", "Зеркало с подсветкой"]),
    isAvailable: true,
    rating: 45,
    reviewCount: 12
  },
  {
    name: "Место визажиста №1",
    description: "Идеальное место для визажиста с профессиональным освещением",
    type: "makeup",
    pricePerHour: 60000,
    pricePerDay: 400000,
    imageUrl: "/workspaces/makeup-1.jpg",
    amenities: JSON.stringify(["Кольцевая лампа", "Зеркало", "Стул для клиента"]),
    isAvailable: true,
    rating: 48,
    reviewCount: 15
  },
  {
    name: "Маникюрный стол №1",
    description: "Оборудованное место для маникюра и педикюра",
    type: "manicure",
    pricePerHour: 40000,
    pricePerDay: 280000,
    imageUrl: "/workspaces/manicure-1.jpg",
    amenities: JSON.stringify(["Лампа UV", "Вытяжка", "Стерилизатор"]),
    isAvailable: true,
    rating: 46,
    reviewCount: 20
  },
  {
    name: "Кабинет косметолога №1",
    description: "Отдельный кабинет для косметологических процедур",
    type: "cosmetology",
    pricePerHour: 80000,
    pricePerDay: 550000,
    imageUrl: "/workspaces/cosmetology-1.jpg",
    amenities: JSON.stringify(["Кушетка", "Аппарат для чистки", "Стерилизатор"]),
    isAvailable: true,
    rating: 50,
    reviewCount: 8
  },
  {
    name: "Массажный кабинет №1",
    description: "Уютный кабинет для массажа и СПА-процедур",
    type: "massage",
    pricePerHour: 70000,
    pricePerDay: 480000,
    imageUrl: "/workspaces/massage-1.jpg",
    amenities: JSON.stringify(["Массажный стол", "Ароматерапия", "Музыка"]),
    isAvailable: true,
    rating: 47,
    reviewCount: 10
  }
]);

console.log("Database seeded successfully!");
await client.end();
