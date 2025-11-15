import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://beauty_user:beauty_pass@localhost:5432/beauty_coworking');

const reviewTexts = {
  5: [
    'Превосходно! Все продумано до мелочей.',
    'Идеальные условия для работы, клиенты в восторге!',
    'Лучшее место, где я работала! Спасибо за комфорт!',
    'Замечательное место с отличным оборудованием!',
    'Прекрасное рабочее место, буду бронировать еще!',
    'Все на высшем уровне! Рекомендую всем коллегам.'
  ],
  4: [
    'Очень довольна! Оборудование современное, атмосфера приятная.',
    'Все понравилось, буду бронировать снова.',
    'В целом все хорошо, рекомендую!',
    'Достойное место, цена соответствует качеству.',
    'Хорошие условия для работы, небольшие недочеты есть.'
  ],
  3: [
    'Нормально, но ожидала большего.',
    'Неплохое место, удобное расположение.',
    'Приемлемо, но не идеально.',
    'Все на уровне, небольшие замечания по чистоте.',
    'Хорошее место, но можно улучшить освещение.'
  ],
  2: [
    'Неплохо, но были небольшие проблемы.',
    'Ожидала лучшего качества.',
    'Есть что улучшать, особенно вентиляцию.',
    'Средненько, за эту цену можно найти лучше.'
  ],
  1: [
    'Разочарована, оборудование старое.',
    'Не рекомендую, много недостатков.',
    'Плохой опыт, больше не вернусь.'
  ]
};

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(startDate, endDate) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

async function generateReviews() {
  try {
    console.log('Начинаем генерацию отзывов от разных пользователей...');

    // Получаем всех пользователей
    const users = await sql`SELECT id, name FROM users ORDER BY id`;
    console.log(`Найдено пользователей: ${users.length}`);

    // Получаем все рабочие места
    const workspaces = await sql`SELECT id, name FROM workspaces ORDER BY id`;
    console.log(`Найдено рабочих мест: ${workspaces.length}`);

    // Удаляем старые отзывы
    await sql`DELETE FROM reviews`;
    console.log('Старые отзывы удалены');

    const startDate = new Date('2025-05-01');
    const endDate = new Date('2025-11-14');

    let totalReviews = 0;

    // Для каждого рабочего места генерируем отзывы
    for (const workspace of workspaces) {
      // Случайное количество отзывов от 5 до 12
      const reviewCount = Math.floor(Math.random() * 8) + 5;
      
      console.log(`\nГенерируем ${reviewCount} отзывов для "${workspace.name}"...`);

      // Выбираем случайных пользователей для этого места
      const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
      const selectedUsers = shuffledUsers.slice(0, reviewCount);

      for (const user of selectedUsers) {
        // Случайный рейтинг от 1 до 5
        const rating = Math.floor(Math.random() * 5) + 1;
        
        // Выбираем случайный текст отзыва для данного рейтинга
        const comment = getRandomElement(reviewTexts[rating]);
        
        // Случайная дата
        const createdAt = getRandomDate(startDate, endDate);

        await sql`
          INSERT INTO reviews ("workspaceId", "userId", rating, comment, "createdAt", "updatedAt")
          VALUES (${workspace.id}, ${user.id}, ${rating}, ${comment}, ${createdAt}, ${createdAt})
        `;

        totalReviews++;
      }
    }

    console.log(`\nВсего создано отзывов: ${totalReviews}`);

    // Обновляем рейтинги и количество отзывов для каждого рабочего места
    console.log('\nОбновляем рейтинги рабочих мест...');
    
    for (const workspace of workspaces) {
      const stats = await sql`
        SELECT 
          CAST(AVG(rating) AS DECIMAL(2,1)) as avg_rating,
          COUNT(*) as review_count
        FROM reviews
        WHERE "workspaceId" = ${workspace.id}
      `;

      if (stats.length > 0 && stats[0].review_count > 0) {
        await sql`
          UPDATE workspaces
          SET 
            rating = ${stats[0].avg_rating},
            "reviewCount" = ${stats[0].review_count}
          WHERE id = ${workspace.id}
        `;
        
        console.log(`${workspace.name}: рейтинг ${stats[0].avg_rating}, отзывов ${stats[0].review_count}`);
      }
    }

    console.log('\n✅ Генерация отзывов завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при генерации отзывов:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

generateReviews();
