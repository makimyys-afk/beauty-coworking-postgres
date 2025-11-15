import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://beauty_user:beauty_pass_2024@localhost:5432/beauty_coworking";

const sql = postgres(DATABASE_URL);

console.log("Создание данных: 18 бронирований, 2 активных, 12 завершенных, баланс 7200₽...");

try {
  const userId = 1;

  // Очистка старых данных
  await sql`DELETE FROM transactions WHERE "userId" = ${userId}`;
  await sql`DELETE FROM bookings WHERE "userId" = ${userId}`;
  console.log("✓ Старые данные очищены");

  // Создаем 18 бронирований
  const bookingsData = [];
  
  // 12 завершенных бронирований (разные суммы в рублях, не копейках!)
  const completedPrices = [2000, 2400, 1600, 3200, 2800, 2000, 2400, 1600, 3200, 2800, 2000, 2400];
  for (let i = 0; i < 12; i++) {
    const workspaceId = (i % 5) + 1;
    const date = new Date(2024, 10, i + 1);
    bookingsData.push({
      workspaceId,
      startTime: new Date(date.setHours(9, 0, 0)),
      endTime: new Date(date.setHours(13, 0, 0)),
      totalPrice: completedPrices[i],
      status: "completed",
      paymentStatus: "paid"
    });
  }

  // 2 активных бронирования
  const activePrices = [2000, 2400];
  for (let i = 0; i < 2; i++) {
    const workspaceId = i + 1;
    const date = new Date(2025, 0, 15 + i);
    bookingsData.push({
      workspaceId,
      startTime: new Date(date.setHours(10, 0, 0)),
      endTime: new Date(date.setHours(14, 0, 0)),
      totalPrice: activePrices[i],
      status: "confirmed",
      paymentStatus: "paid"
    });
  }

  // 4 отмененных бронирования (не влияют на баланс, возвраты)
  for (let i = 0; i < 4; i++) {
    const workspaceId = (i % 5) + 1;
    const date = new Date(2024, 9, i + 1);
    bookingsData.push({
      workspaceId,
      startTime: new Date(date.setHours(11, 0, 0)),
      endTime: new Date(date.setHours(15, 0, 0)),
      totalPrice: 2000,
      status: "cancelled",
      paymentStatus: "refunded"
    });
  }

  // Вставляем бронирования
  for (const booking of bookingsData) {
    await sql`
      INSERT INTO bookings ("workspaceId", "userId", "startTime", "endTime", "totalPrice", status, "paymentStatus", notes, "createdAt", "updatedAt")
      VALUES (${booking.workspaceId}, ${userId}, ${booking.startTime}, ${booking.endTime}, ${booking.totalPrice}, ${booking.status}, ${booking.paymentStatus}, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
  }
  console.log(`✓ Создано ${bookingsData.length} бронирований`);

  // Рассчитываем общую сумму оплат
  const totalPaidForCompleted = completedPrices.reduce((a, b) => a + b, 0);
  const totalPaidForActive = activePrices.reduce((a, b) => a + b, 0);
  const totalPaid = totalPaidForCompleted + totalPaidForActive;
  
  // Чтобы баланс был 7200₽, нужно: пополнение - расходы = 7200
  // пополнение = 7200 + totalPaid
  const depositAmount = 7200 + totalPaid;

  // Пополнение баланса
  await sql`
    INSERT INTO transactions ("userId", type, amount, status, description, "createdAt", "updatedAt")
    VALUES (${userId}, 'deposit', ${depositAmount}, 'completed', 'Пополнение баланса', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;

  // Списания за завершенные бронирования
  for (let i = 0; i < 12; i++) {
    await sql`
      INSERT INTO transactions ("userId", type, amount, status, description, "createdAt", "updatedAt")
      VALUES (${userId}, 'payment', ${-completedPrices[i]}, 'completed', ${`Оплата бронирования #${i + 1}`}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
  }

  // Списания за активные бронирования
  for (let i = 0; i < 2; i++) {
    await sql`
      INSERT INTO transactions ("userId", type, amount, status, description, "createdAt", "updatedAt")
      VALUES (${userId}, 'payment', ${-activePrices[i]}, 'completed', ${`Оплата бронирования #${13 + i}`}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
  }

  console.log(`✓ Создано транзакций`);

  console.log("\n=== Итоговая статистика ===");
  const stats = await sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM bookings WHERE "userId" = ${userId}
  `;
  console.log("Всего бронирований:", stats[0].total);
  console.log("Активные:", stats[0].active);
  console.log("Завершенные:", stats[0].completed);

  const balanceResult = await sql`
    SELECT SUM(amount) as balance FROM transactions WHERE "userId" = ${userId}
  `;
  console.log("Баланс:", balanceResult[0].balance, "₽");

} catch (error) {
  console.error("Ошибка:", error.message);
  console.error(error);
}

await sql.end();
console.log("\nДанные успешно созданы!");
