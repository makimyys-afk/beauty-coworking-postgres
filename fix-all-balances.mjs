import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { users, transactions, bookings } from "./drizzle/schema.ts";

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function fixAllBalances() {
  try {
    console.log("🔍 Поиск всех пользователей с некорректными балансами...\n");
    
    // Получаем всех пользователей
    const allUsers = await db.select().from(users);
    console.log(`Найдено пользователей: ${allUsers.length}\n`);
    
    const usersToFix = [];
    
    for (const user of allUsers) {
      const userId = user.id;
      const userName = user.name || "Без имени";
      
      // Получаем транзакции пользователя
      const userTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId));
      
      // Рассчитываем текущий баланс
      const currentBalance = userTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Получаем бронирования пользователя
      const userBookings = await db.select().from(bookings).where(eq(bookings.userId, userId));
      
      // Находим стартовый депозит
      const depositTransaction = userTransactions.find(t => 
        t.type === "deposit" && 
        (t.description?.includes("Стартовый бонус") || t.description?.includes("регистрации"))
      );
      
      const initialDeposit = depositTransaction ? depositTransaction.amount : 0;
      
      // Правильный баланс = стартовый депозит - сумма всех бронирований
      const totalBookingsCost = userBookings.reduce((sum, b) => sum + b.totalPrice, 0);
      const correctBalance = initialDeposit - totalBookingsCost;
      
      const difference = correctBalance - currentBalance;
      
      console.log(`👤 ${userName} (ID: ${userId})`);
      console.log(`   Стартовый депозит: ${initialDeposit}₽`);
      console.log(`   Бронирований: ${userBookings.length} на сумму ${totalBookingsCost}₽`);
      console.log(`   Текущий баланс: ${currentBalance}₽`);
      console.log(`   Правильный баланс: ${correctBalance}₽`);
      
      if (difference !== 0) {
        console.log(`   ⚠️  ТРЕБУЕТСЯ КОРРЕКТИРОВКА: ${difference > 0 ? '+' : ''}${difference}₽`);
        usersToFix.push({ userId, userName, difference, currentBalance, correctBalance });
      } else {
        console.log(`   ✅ Баланс корректен`);
      }
      console.log("");
    }
    
    if (usersToFix.length === 0) {
      console.log("\n✅ Все балансы корректны, исправление не требуется");
    } else {
      console.log(`\n⚠️  Найдено пользователей с некорректным балансом: ${usersToFix.length}`);
      console.log("\n💉 Создание корректирующих транзакций...\n");
      
      for (const userInfo of usersToFix) {
        console.log(`Исправление баланса для ${userInfo.userName}...`);
        
        await db.insert(transactions).values({
          userId: userInfo.userId,
          type: userInfo.difference > 0 ? "deposit" : "payment",
          amount: userInfo.difference,
          status: "completed",
          description: `Корректировка баланса (исправление бага с расчетом скидок при бронировании)`
        });
        
        console.log(`✅ ${userInfo.userName}: ${userInfo.currentBalance}₽ → ${userInfo.correctBalance}₽`);
      }
      
      console.log("\n🎉 Все балансы исправлены!");
    }
    
  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await client.end();
  }
}

fixAllBalances();
