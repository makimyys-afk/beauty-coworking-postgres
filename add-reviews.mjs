import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

const reviews = [
  {
    userId: 30037,
    workspaceId: 1,
    rating: 5,
    comment: 'Отличное место! Очень удобное кресло, хорошее освещение. Клиенты довольны результатом. Обязательно вернусь снова!',
    createdAt: new Date('2024-12-15')
  },
  {
    userId: 30037,
    workspaceId: 2,
    rating: 5,
    comment: 'Прекрасный кабинет для косметологических процедур. Все необходимое оборудование в отличном состоянии. Рекомендую!',
    createdAt: new Date('2024-12-20')
  },
  {
    userId: 30037,
    workspaceId: 3,
    rating: 4,
    comment: 'Хорошее место для маникюра. Немного тесновато, но в целом все устраивает. Чистота на высоте.',
    createdAt: new Date('2025-01-05')
  },
  {
    userId: 30037,
    workspaceId: 4,
    rating: 5,
    comment: 'Визажное место просто супер! Идеальное освещение для макияжа, большое зеркало. Клиентки в восторге!',
    createdAt: new Date('2025-01-10')
  },
  {
    userId: 30037,
    workspaceId: 5,
    rating: 5,
    comment: 'Массажный кабинет очень уютный и спокойный. Отличная звукоизоляция, приятная атмосфера для релаксации.',
    createdAt: new Date('2025-01-12')
  }
];

try {
  console.log('Добавление отзывов...');
  
  for (const review of reviews) {
    await sql`
      INSERT INTO reviews (userId, workspaceId, rating, comment, createdAt) 
      VALUES (${review.userId}, ${review.workspaceId}, ${review.rating}, ${review.comment}, ${review.createdAt})
    `;
    console.log(`Добавлен отзыв для workspace #${review.workspaceId}`);
  }
  
  console.log('\nВсе отзывы успешно добавлены!');
} finally {
  await sql.end();
}
