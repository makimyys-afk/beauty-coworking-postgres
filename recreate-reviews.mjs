import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

const names = [
  'Анна Смирнова', 'Елена Иванова', 'Мария Петрова', 'Ольга Сидорова',
  'Татьяна Козлова', 'Наталья Морозова', 'Екатерина Новикова', 'Ирина Волкова',
  'Юлия Соколова', 'Светлана Лебедева', 'Виктория Егорова', 'Дарья Павлова',
  'Алина Семенова', 'Кристина Федорова', 'Вера Михайлова', 'Полина Александрова'
];

const reviewTemplates = {
  5: [
    'Отличное место! Все необходимое под рукой, чистота на высшем уровне. Клиенты в восторге от результата!',
    'Прекрасное рабочее пространство! Удобно, комфортно, профессионально. Буду бронировать еще!',
    'Замечательный кабинет! Отличное оборудование, приятная атмосфера. Рекомендую всем коллегам!',
    'Идеальное место для работы! Все продумано до мелочей. Клиенты остались очень довольны!',
    'Супер! Современное оборудование, уютная обстановка. Работать одно удовольствие!'
  ],
  4: [
    'Хорошее место, но есть небольшие недочеты. В целом рекомендую.',
    'Неплохой кабинет. Все необходимое есть, но можно было бы улучшить освещение.',
    'Достойное место для работы. Чисто, аккуратно. Единственный минус - немного тесновато.',
    'Хорошее оборудование и расположение. Небольшие замечания по организации пространства.'
  ],
  3: [
    'Среднее место. Подходит для работы, но есть что улучшить.',
    'Нормально, но ожидала большего. Чистота есть, но обстановка простая.'
  ]
};

try {
  await sql`DELETE FROM reviews`;
  console.log('Старые отзывы удалены');

  const userIds = [];
  for (let i = 0; i < names.length; i++) {
    const openId = `fake_user_${i}_${Date.now()}`;
    const name = names[i];
    
    const result = await sql`
      INSERT INTO users (openId, name, email, role, createdAt, updatedAt, lastSignedIn) 
      VALUES (${openId}, ${name}, ${openId + '@example.com'}, 'user', NOW(), NOW(), NOW())
      RETURNING id
    `;
    
    userIds.push({ id: result[0].id, name });
  }
  
  console.log(`Создано ${userIds.length} пользователей`);

  const workspaces = [
    { id: 1, count: 12 },
    { id: 2, count: 9 },
    { id: 3, count: 7 },
    { id: 4, count: 11 },
    { id: 5, count: 8 },
  ];

  let totalReviews = 0;
  for (const workspace of workspaces) {
    console.log(`\nГенерация отзывов для workspace #${workspace.id}...`);
    
    for (let i = 0; i < workspace.count; i++) {
      const user = userIds[Math.floor(Math.random() * userIds.length)];
      
      const rand = Math.random();
      let rating;
      if (rand < 0.6) rating = 5;
      else if (rand < 0.9) rating = 4;
      else rating = 3;
      
      const templates = reviewTemplates[rating];
      const comment = templates[Math.floor(Math.random() * templates.length)];
      
      const daysAgo = Math.floor(Math.random() * 90);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      
      await sql`
        INSERT INTO reviews (userId, workspaceId, rating, comment, createdAt, updatedAt) 
        VALUES (${user.id}, ${workspace.id}, ${rating}, ${comment}, ${createdAt}, ${createdAt})
      `;
      
      totalReviews++;
    }
    
    const reviews = await sql`
      SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE workspaceId = ${workspace.id}
    `;
    
    const avgRating = Number(reviews[0].avgRating);
    const count = reviews[0].count;
    
    await sql`
      UPDATE workspaces SET rating = ${Math.round(avgRating * 10)}, reviewCount = ${count} WHERE id = ${workspace.id}
    `;
    
    console.log(`  Создано ${count} отзывов, средний рейтинг: ${avgRating.toFixed(1)}`);
  }
  
  console.log(`\n✅ Всего создано ${totalReviews} отзывов от ${userIds.length} пользователей`);
  
} finally {
  await sql.end();
}
