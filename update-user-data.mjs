import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

console.log("Updating user data for Орлова Мария...");

try {
  // Получаем ID пользователя
  const users = await sql`
    SELECT id FROM users WHERE openId = 'mock-orlova-maria'
  `;
  
  const userId = users[0].id;
  console.log(`User ID: ${userId}`);

  // Удаляем старые данные
  await sql`DELETE FROM reviews WHERE userId = ${userId}`;
  await sql`DELETE FROM transactions WHERE userId = ${userId}`;
  await sql`DELETE FROM bookings WHERE userId = ${userId}`;
  console.log("✓ Old data cleared");

  // Добавляем 15 бронирований
  const bookingsData = [
    // Завершенные бронирования (12 штук)
    { workspaceId: 1, startTime: "2024-12-05T09:00:00", endTime: "2024-12-05T13:00:00", totalPrice: 200000, status: "completed", paymentStatus: "paid", notes: "Стрижка и укладка" },
    { workspaceId: 2, startTime: "2024-12-08T14:00:00", endTime: "2024-12-08T18:00:00", totalPrice: 240000, status: "completed", paymentStatus: "paid", notes: "Вечерний макияж" },
    { workspaceId: 3, startTime: "2024-12-10T10:00:00", endTime: "2024-12-10T14:00:00", totalPrice: 160000, status: "completed", paymentStatus: "paid", notes: "Маникюр и педикюр" },
    { workspaceId: 4, startTime: "2024-12-12T11:00:00", endTime: "2024-12-12T15:00:00", totalPrice: 320000, status: "completed", paymentStatus: "paid", notes: "Косметологические процедуры" },
    { workspaceId: 5, startTime: "2024-12-15T13:00:00", endTime: "2024-12-15T16:00:00", totalPrice: 210000, status: "completed", paymentStatus: "paid", notes: "Расслабляющий массаж" },
    { workspaceId: 1, startTime: "2024-12-18T10:00:00", endTime: "2024-12-18T12:00:00", totalPrice: 100000, status: "completed", paymentStatus: "paid", notes: "Окрашивание" },
    { workspaceId: 2, startTime: "2024-12-20T15:00:00", endTime: "2024-12-20T17:00:00", totalPrice: 120000, status: "completed", paymentStatus: "paid", notes: "Дневной макияж" },
    { workspaceId: 3, startTime: "2024-12-22T09:00:00", endTime: "2024-12-22T11:00:00", totalPrice: 80000, status: "completed", paymentStatus: "paid", notes: "Экспресс-маникюр" },
    { workspaceId: 6, startTime: "2024-12-25T14:00:00", endTime: "2024-12-25T18:00:00", totalPrice: 180000, status: "completed", paymentStatus: "paid", notes: "Праздничная укладка" },
    { workspaceId: 4, startTime: "2024-12-28T10:00:00", endTime: "2024-12-28T13:00:00", totalPrice: 240000, status: "completed", paymentStatus: "paid", notes: "Чистка лица" },
    { workspaceId: 5, startTime: "2025-01-03T11:00:00", endTime: "2025-01-03T14:00:00", totalPrice: 210000, status: "completed", paymentStatus: "paid", notes: "Антицеллюлитный массаж" },
    { workspaceId: 1, startTime: "2025-01-06T09:00:00", endTime: "2025-01-06T12:00:00", totalPrice: 150000, status: "completed", paymentStatus: "paid", notes: "Стрижка и окрашивание" },
    
    // Активные бронирования (3 штук)
    { workspaceId: 2, startTime: "2025-01-16T14:00:00", endTime: "2025-01-16T17:00:00", totalPrice: 180000, status: "confirmed", paymentStatus: "paid", notes: "Свадебный макияж" },
    { workspaceId: 3, startTime: "2025-01-18T10:00:00", endTime: "2025-01-18T13:00:00", totalPrice: 120000, status: "confirmed", paymentStatus: "paid", notes: "Наращивание ногтей" },
    { workspaceId: 4, startTime: "2025-01-20T15:00:00", endTime: "2025-01-20T18:00:00", totalPrice: 240000, status: "pending", paymentStatus: "pending", notes: "Консультация косметолога" }
  ];

  for (const booking of bookingsData) {
    await sql`
      INSERT INTO bookings (workspaceId, userId, startTime, endTime, totalPrice, status, paymentStatus, notes, createdAt, updatedAt)
      VALUES (${booking.workspaceId}, ${userId}, ${new Date(booking.startTime)}, ${new Date(booking.endTime)}, ${booking.totalPrice}, ${booking.status}, ${booking.paymentStatus}, ${booking.notes}, NOW(), NOW())
    `;
  }
  console.log("✓ 15 bookings created");

  // Добавляем транзакции для баланса 8000 рублей
  // Пополнение: 10000 рублей
  // Расходы: 2000 рублей (оплата бронирований)
  // Итоговый баланс: 8000 рублей
  
  const transactionsData = [
    { type: "deposit", amount: 1000000, status: "completed", description: "Пополнение баланса" },
    { type: "payment", amount: 200000, status: "completed", description: "Оплата бронирования" },
  ];

  for (const transaction of transactionsData) {
    await sql`
      INSERT INTO transactions (userId, type, amount, status, description, createdAt, updatedAt)
      VALUES (${userId}, ${transaction.type}, ${transaction.amount}, ${transaction.status}, ${transaction.description}, NOW(), NOW())
    `;
  }
  console.log("✓ Transactions created (balance: 8000 RUB)");

  // Добавляем отзывы
  const reviewsData = [
    { workspaceId: 1, rating: 5, comment: "Отличное место! Все необходимое оборудование, чистота и порядок. Обязательно вернусь!" },
    { workspaceId: 2, rating: 5, comment: "Прекрасное освещение для визажа, удобное кресло. Клиенты очень довольны результатом!" },
    { workspaceId: 3, rating: 4, comment: "Хорошее место для маникюра, но хотелось бы больше вариантов инструментов." },
    { workspaceId: 4, rating: 5, comment: "Косметологический кабинет на высшем уровне! Современное оборудование." },
    { workspaceId: 5, rating: 5, comment: "Идеальная атмосфера для массажа, клиенты в восторге!" }
  ];

  for (const review of reviewsData) {
    await sql`
      INSERT INTO reviews (workspaceId, userId, rating, comment, createdAt, updatedAt)
      VALUES (${review.workspaceId}, ${userId}, ${review.rating}, ${review.comment}, NOW(), NOW())
    `;
  }
  console.log("✓ Reviews created");

} catch (error) {
  console.error("Error updating user data:", error.message);
}

await sql.end();
console.log("User data update completed!");
