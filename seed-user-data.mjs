import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

console.log("Seeding user data for Орлова Мария...");

try {
  // Создаем пользователя Орлова Мария
  await sql`
    INSERT INTO users (openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn) 
    VALUES ('mock-orlova-maria', 'Орлова Мария', 'orlova.maria@example.com', 'mock', 'user', NOW(), NOW(), NOW())
    ON CONFLICT (openId) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email
  `;
  
  // Получаем ID пользователя
  const users = await sql`
    SELECT id FROM users WHERE openId = 'mock-orlova-maria'
  `;
  
  const userId = users[0].id;
  console.log(`✓ User created/updated with ID: ${userId}`);

  // Добавляем бронирования
  const bookingsData = [
    {
      workspaceId: 1,
      startTime: new Date("2025-01-10T09:00:00"),
      endTime: new Date("2025-01-10T13:00:00"),
      totalPrice: 200000, // 4 часа * 500 руб
      status: "completed",
      paymentStatus: "paid",
      notes: "Работа с клиентом"
    },
    {
      workspaceId: 2,
      startTime: new Date("2025-01-12T14:00:00"),
      endTime: new Date("2025-01-12T18:00:00"),
      totalPrice: 240000, // 4 часа * 600 руб
      status: "completed",
      paymentStatus: "paid",
      notes: "Визаж для фотосессии"
    },
    {
      workspaceId: 3,
      startTime: new Date("2025-01-15T10:00:00"),
      endTime: new Date("2025-01-15T12:00:00"),
      totalPrice: 80000, // 2 часа * 400 руб
      status: "confirmed",
      paymentStatus: "paid",
      notes: null
    }
  ];

  for (const booking of bookingsData) {
    await sql`
      INSERT INTO bookings (workspaceId, userId, startTime, endTime, totalPrice, status, paymentStatus, notes, createdAt, updatedAt)
      VALUES (${booking.workspaceId}, ${userId}, ${booking.startTime}, ${booking.endTime}, ${booking.totalPrice}, ${booking.status}, ${booking.paymentStatus}, ${booking.notes}, NOW(), NOW())
    `;
  }
  console.log("✓ Bookings created");

  // Добавляем транзакции
  const transactionsData = [
    {
      type: "deposit",
      amount: 500000, // 5000 руб пополнение
      status: "completed",
      description: "Пополнение баланса"
    },
    {
      type: "payment",
      amount: 200000,
      status: "completed",
      description: "Оплата бронирования #1"
    },
    {
      type: "payment",
      amount: 240000,
      status: "completed",
      description: "Оплата бронирования #2"
    },
    {
      type: "payment",
      amount: 80000,
      status: "completed",
      description: "Оплата бронирования #3"
    }
  ];

  for (const transaction of transactionsData) {
    await sql`
      INSERT INTO transactions (userId, type, amount, status, description, createdAt, updatedAt)
      VALUES (${userId}, ${transaction.type}, ${transaction.amount}, ${transaction.status}, ${transaction.description}, NOW(), NOW())
    `;
  }
  console.log("✓ Transactions created");

  // Добавляем отзывы
  const reviewsData = [
    {
      workspaceId: 1,
      rating: 5,
      comment: "Отличное место! Все необходимое оборудование, чистота и порядок. Обязательно вернусь!"
    },
    {
      workspaceId: 2,
      rating: 5,
      comment: "Прекрасное освещение для визажа, удобное кресло. Клиенты очень довольны результатом!"
    }
  ];

  for (const review of reviewsData) {
    await sql`
      INSERT INTO reviews (workspaceId, userId, rating, comment, createdAt, updatedAt)
      VALUES (${review.workspaceId}, ${userId}, ${review.rating}, ${review.comment}, NOW(), NOW())
    `;
  }
  console.log("✓ Reviews created");

} catch (error) {
  console.error("Error seeding user data:", error.message);
}

await sql.end();
console.log("User data seeding completed!");
