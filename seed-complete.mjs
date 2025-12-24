import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://beauty_user:beauty_pass_2024@localhost:5432/beauty_coworking";

const sql = postgres(DATABASE_URL);

console.log("Создание полного набора данных...");

try {
  // Создаем пользователя
  const userResult = await sql`
    INSERT INTO users ("openId", name, email, role, status, points, "createdAt", "updatedAt")
    VALUES ('mock-orlova-maria', 'Орлова Мария', 'orlova.maria@example.com', 'user', 'bronze', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("openId") DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email
    RETURNING id
  `;
  const userId = userResult[0].id;
  console.log(`✓ Пользователь создан (ID: ${userId})`);

  // Создаем рабочие места
  await sql`
    INSERT INTO workspaces (name, description, type, "pricePerHour", "pricePerDay", "imageUrl", amenities, "isAvailable", rating, "reviewCount", "createdAt", "updatedAt")
    VALUES 
      ('Парикмахерское место №1', 'Современное рабочее место для парикмахера с профессиональным оборудованием', 'hairdresser', 800, 5600, '/workspace-hairdresser.jpg', '["Фен", "Утюжок", "Плойка", "Зеркало с подсветкой"]', true, 4.5, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('Место визажиста №1', 'Идеальное место для визажиста с профессиональным освещением', 'makeup', 600, 4200, '/workspace-makeup.jpg', '["Кольцевая лампа", "Зеркало", "Стул для клиента"]', true, 4.8, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('Маникюрный стол №1', 'Оборудованное место для маникюра и педикюра', 'manicure', 700, 4900, '/workspace-manicure.jpg', '["Лампа UV", "Вытяжка", "Стерилизатор"]', true, 4.6, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('Кабинет косметолога №1', 'Отдельный кабинет для косметологических процедур', 'cosmetology', 400, 2800, '/workspace-cosmetology.jpg', '["Кушетка", "Аппарат для чистки", "Стерилизатор"]', true, 5.0, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('Массажный кабинет №1', 'Уютный кабинет для массажа и СПА-процедур', 'massage', 500, 3500, '/workspace-massage.jpg', '["Массажный стол", "Ароматерапия", "Музыка"]', true, 4.7, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
  `;
  console.log("✓ Рабочие места созданы");

  // Очистка старых данных пользователя
  await sql`DELETE FROM transactions WHERE "userId" = ${userId}`;
  await sql`DELETE FROM bookings WHERE "userId" = ${userId}`;
  console.log("✓ Старые данные очищены");

  // Создаем 18 бронирований
  const bookingsData = [];
  
  // 12 завершенных бронирований
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

  // 4 отмененных бронирования
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

  // Рассчитываем баланс
  const totalPaidForCompleted = completedPrices.reduce((a, b) => a + b, 0);
  const totalPaidForActive = activePrices.reduce((a, b) => a + b, 0);
  const totalPaid = totalPaidForCompleted + totalPaidForActive;
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

  console.log("✓ Транзакции созданы");

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

  const workspacesCount = await sql`SELECT COUNT(*) as count FROM workspaces`;
  console.log("Рабочих мест:", workspacesCount[0].count);

} catch (error) {
  console.error("Ошибка:", error.message);
  console.error(error);
}

await sql.end();
console.log("\n✅ База данных полностью заполнена!");
