import postgres from "postgres";

const sql = postgres({
  host: "localhost",
  user: "beauty_user",
  password: "beauty_pass_2024",
  database: "beauty_coworking",
});

// Список имен для отзывов
const names = [
  "Анна Иванова", "Мария Петрова", "Елена Сидорова", "Ольга Смирнова",
  "Наталья Козлова", "Татьяна Новикова", "Ирина Морозова", "Светлана Волкова",
  "Екатерина Соколова", "Юлия Лебедева", "Дарья Козлова", "Алина Павлова",
  "Виктория Семенова", "Кристина Егорова", "Полина Федорова", "Валерия Михайлова",
  "Александра Андреева", "Вероника Николаева", "Диана Захарова", "Маргарита Романова"
];

// Список комментариев для разных оценок
const comments = {
  5: [
    "Отличное место! Все очень чисто и профессионально оборудовано.",
    "Прекрасное рабочее место, буду бронировать еще!",
    "Все на высшем уровне! Рекомендую всем коллегам.",
    "Идеальные условия для работы, клиенты в восторге!",
    "Очень довольна! Оборудование современное, атмосфера приятная.",
    "Лучшее место, где я работала! Спасибо за комфорт!",
    "Превосходно! Все продумано до мелочей.",
    "Замечательное место с отличным оборудованием!"
  ],
  4: [
    "Хорошее место, но можно улучшить освещение.",
    "В целом все хорошо, рекомендую!",
    "Неплохое место, удобное расположение.",
    "Все понравилось, буду бронировать снова.",
    "Хорошие условия для работы, небольшие недочеты есть.",
    "Достойное место, цена соответствует качеству.",
    "Все на уровне, небольшие замечания по чистоте."
  ],
  3: [
    "Нормально, но ожидала большего.",
    "Средненько, есть что улучшить.",
    "Приемлемо, но не идеально.",
    "Неплохо, но были небольшие проблемы.",
    "Обычное место, ничего особенного."
  ],
  2: [
    "Разочарована, оборудование старое.",
    "Не очень, много недостатков.",
    "Ожидала лучшего качества."
  ],
  1: [
    "Очень плохо, не рекомендую.",
    "Ужасные условия, больше не вернусь."
  ]
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomRating() {
  // Генерируем рейтинг с уклоном в сторону высоких оценок
  const rand = Math.random();
  if (rand < 0.5) return 5; // 50% - отлично
  if (rand < 0.75) return 4; // 25% - хорошо
  if (rand < 0.9) return 3;  // 15% - нормально
  if (rand < 0.97) return 2; // 7% - плохо
  return 1;                   // 3% - очень плохо
}

function getRandomDate() {
  // Генерируем случайную дату за последние 6 месяцев
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
}

async function generateReviews() {
  console.log("Начинаем генерацию отзывов...");
  
  // Получаем все рабочие места
  const allWorkspaces = await sql`SELECT * FROM workspaces`;
  
  for (const workspace of allWorkspaces) {
    const reviewCount = getRandomInt(4, 14);
    console.log(`\nГенерируем ${reviewCount} отзывов для "${workspace.name}"...`);
    
    const usedNames = new Set();
    let totalRating = 0;
    
    for (let i = 0; i < reviewCount; i++) {
      // Выбираем уникальное имя
      let userName;
      do {
        userName = getRandomElement(names);
      } while (usedNames.has(userName));
      usedNames.add(userName);
      
      const rating = getRandomRating();
      totalRating += rating;
      const comment = getRandomElement(comments[rating]);
      const createdAt = getRandomDate();
      
      await sql`
        INSERT INTO reviews ("workspaceId", "userId", rating, comment, "createdAt") 
        VALUES (${workspace.id}, 1, ${rating}, ${comment}, ${createdAt})
      `;
      
      console.log(`  ✓ ${userName}: ${rating} звезд - "${comment}"`);
    }
    
    // Обновляем средний рейтинг и количество отзывов
    const avgRating = (totalRating / reviewCount).toFixed(1);
    await sql`
      UPDATE workspaces SET rating = ${avgRating}, "reviewCount" = ${reviewCount} WHERE id = ${workspace.id}
    `;
    
    console.log(`  → Средний рейтинг: ${avgRating} (${reviewCount} отзывов)`);
  }
  
  console.log("\n✅ Генерация отзывов завершена!");
  await sql.end();
}

generateReviews().catch(console.error);
