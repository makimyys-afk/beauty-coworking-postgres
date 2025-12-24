import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

console.log("Seeding database...");

// Вставка рабочих мест
const workspacesData = [
  ["Парикмахерское место №1", "Современное рабочее место с профессиональным оборудованием для парикмахеров. Включает кресло, зеркало, фен и все необходимые инструменты.", "hairdresser", 50000, 350000, "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800", '["Профессиональное кресло","Большое зеркало","Фен","Стерилизатор","Wi-Fi"]', 1, 48, 12],
  ["Визажное место Premium", "Премиум место для визажистов с профессиональным освещением и большим зеркалом.", "makeup", 60000, 400000, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800", '["Кольцевая лампа","Профессиональное зеркало","Удобное кресло","Розетки","Wi-Fi"]', 1, 50, 8],
  ["Маникюрный стол №3", "Уютное место для мастеров маникюра с вытяжкой и всем необходимым оборудованием.", "manicure", 40000, 280000, "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800", '["Вытяжка","Лампа для маникюра","Стерилизатор","Удобные стулья","Wi-Fi"]', 1, 45, 15],
  ["Косметологический кабинет", "Отдельный кабинет для косметологических процедур с кушеткой и профессиональным оборудованием.", "cosmetology", 80000, 550000, "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800", '["Косметологическая кушетка","Стерилизатор","Профессиональное освещение","Отдельный вход","Wi-Fi"]', 1, 49, 6],
  ["Массажный кабинет Relax", "Спокойный кабинет для массажа с удобной кушеткой и расслабляющей атмосферой.", "massage", 70000, 480000, "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800", '["Массажная кушетка","Музыка","Ароматерапия","Теплые полотенца","Wi-Fi"]', 1, 47, 10],
  ["Парикмахерское место №2", "Компактное, но полностью оборудованное место для парикмахеров.", "hairdresser", 45000, 320000, "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800", '["Кресло","Зеркало","Фен","Стерилизатор","Wi-Fi"]', 1, 44, 9]
];

try {
  for (const workspace of workspacesData) {
    await sql`
      INSERT INTO workspaces (name, description, type, "pricePerHour", "pricePerDay", "imageUrl", amenities, "isAvailable", rating, "reviewCount")
      VALUES (${workspace[0]}, ${workspace[1]}, ${workspace[2]}, ${workspace[3]}, ${workspace[4]}, ${workspace[5]}, ${workspace[6]}, ${workspace[7]}, ${workspace[8]}, ${workspace[9]})
    `;
  }
  console.log("✓ Workspaces seeded successfully");
} catch (error) {
  console.error("Error seeding workspaces:", error.message);
}

await sql.end();
console.log("Database seeding completed!");
