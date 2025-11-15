import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

console.log("Создание правильных данных для Орлова Мария...");

try {
  const userId = 1;

  // Создаем 18 бронирований: 2 активных (confirmed), 12 завершенных (completed), 4 отмененных (cancelled)
  const bookingsData = [];
  
  // 12 завершенных бронирований
  for (let i = 0; i < 12; i++) {
    const workspaceId = (i % 5) + 1; // Распределяем по workspace 1-5
    const date = new Date(2024, 10, i + 1); // Ноябрь 2024
    bookingsData.push({
      workspaceId,
      startTime: new Date(date.setHours(9, 0, 0)),
      endTime: new Date(date.setHours(13, 0, 0)),
      totalPrice: [200000, 240000, 160000, 320000, 280000][workspaceId - 1], // 4 часа
      status: "completed",
      paymentStatus: "paid"
    });
  }

  // 2 активных бронирования
  for (let i = 0; i < 2; i++) {
    const workspaceId = i + 1;
    const date = new Date(2025, 0, 15 + i); // Январь 2025
    bookingsData.push({
      workspaceId,
      startTime: new Date(date.setHours(10, 0, 0)),
      endTime: new Date(date.setHours(14, 0, 0)),
      totalPrice: [200000, 240000][i],
      status: "confirmed",
      paymentStatus: "paid"
    });
  }

  // 4 отмененных бронирования
  for (let i = 0; i < 4; i++) {
    const workspaceId = (i % 5) + 1;
    const date = new Date(2024, 9, i + 1); // Октябрь 2024
    bookingsData.push({
      workspaceId,
      startTime: new Date(date.setHours(11, 0, 0)),
      endTime: new Date(date.setHours(15, 0, 0)),
      totalPrice: [200000, 240000, 160000, 320000][i],
      status: "cancelled",
      paymentStatus: "refunded"
    });
  }

  // Вставляем бронирования
  for (const booking of bookingsData) {
    await sql`
      INSERT INTO bookings (workspaceId, userId, startTime, endTime, totalPrice, status, paymentStatus, notes, createdAt, updatedAt)
      VALUES (${booking.workspaceId}, ${userId}, ${booking.startTime}, ${booking.endTime}, ${booking.totalPrice}, ${booking.status}, ${booking.paymentStatus}, ${null}, NOW(), NOW())
    `;
  }
  console.log(`✓ Создано ${bookingsData.length} бронирований`);

  // Создаем транзакции для баланса 7200₽
  // Пополнение 10000₽
  await sql`
    INSERT INTO transactions (userId, type, amount, status, description, createdAt, updatedAt)
    VALUES (${userId}, 'deposit', ${1000000}, 'completed', 'Пополнение баланса', NOW(), NOW())
  `;

  // Списания за завершенные бронирования (12 * примерно 233₽ = 2800₽)
  let totalPaid = 0;
  for (let i = 0; i < 12; i++) {
    const amount = [200000, 240000, 160000, 320000, 280000][i % 5];
    totalPaid += amount;
    await sql`
      INSERT INTO transactions (userId, type, amount, status, description, createdAt, updatedAt)
      VALUES (${userId}, 'payment', ${-amount}, 'completed', ${'Оплата бронирования #' + (i + 1)}, NOW(), NOW())
    `;
  }

  // Списания за активные бронирования (2 * 220₽ = 440₽)
  for (let i = 0; i < 2; i++) {
    const amount = [200000, 240000][i];
    totalPaid += amount;
    await sql`
      INSERT INTO transactions (userId, type, amount, status, description, createdAt, updatedAt)
      VALUES (${userId}, 'payment', ${-amount}, 'completed', ${'Оплата бронирования #' + (13 + i)}, NOW(), NOW())
    `;
  }

  const balance = 1000000 - totalPaid;
  console.log(`✓ Создано транзакций. Баланс: ${balance / 100}₽`);

  console.log("\n=== Итоговая статистика ===");
  const stats = await sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM bookings WHERE userId = ${userId}
  `;
  console.log("Всего бронирований:", stats[0].total);
  console.log("Активные:", stats[0].active);
  console.log("Завершенные:", stats[0].completed);

  const balanceResult = await sql`
    SELECT SUM(amount) as balance FROM transactions WHERE userId = ${userId}
  `;
  console.log("Баланс:", balanceResult[0].balance / 100, "₽");

} catch (error) {
  console.error("Ошибка:", error.message);
}

await sql.end();
console.log("\nДанные успешно созданы!");
