import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('📝 Adding diverse reviews to Beauty Coworking...\n');

const sql = postgres(DATABASE_URL);

try {
  // First, get existing users and workspaces
  const users = await sql`SELECT id, name, email FROM users WHERE role = 'user'`;
  const workspaces = await sql`SELECT id, name FROM workspaces`;
  
  console.log(`Found ${users.length} users and ${workspaces.length} workspaces\n`);
  
  // Create additional test users if needed
  const additionalUsers = [
    { name: 'Анна Петрова', email: 'anna.petrova@example.com', openId: 'anna-petrova', role: 'user' },
    { name: 'Елена Смирнова', email: 'elena.smirnova@example.com', openId: 'elena-smirnova', role: 'user' },
    { name: 'Ирина Козлова', email: 'irina.kozlova@example.com', openId: 'irina-kozlova', role: 'user' },
    { name: 'Ольга Новикова', email: 'olga.novikova@example.com', openId: 'olga-novikova', role: 'user' },
    { name: 'Мария Волкова', email: 'maria.volkova@example.com', openId: 'maria-volkova', role: 'user' },
  ];
  
  console.log('Creating additional users...');
  for (const user of additionalUsers) {
    const existing = await sql`SELECT id FROM users WHERE email = ${user.email}`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO users ("openId", name, email, role, points, status)
        VALUES (${user.openId}, ${user.name}, ${user.email}, ${user.role}, 0, 'bronze')
      `;
      console.log(`  ✅ Created user: ${user.name}`);
    } else {
      console.log(`  ⏭️  User already exists: ${user.name}`);
    }
  }
  
  // Refresh users list
  const allUsers = await sql`SELECT id, name, email FROM users WHERE role = 'user'`;
  console.log(`\nTotal users: ${allUsers.length}\n`);
  
  // Diverse reviews data
  const reviewsData = [
    {
      rating: 5,
      comments: [
        'Отличное место! Очень уютно и комфортно работать. Все необходимое оборудование в наличии.',
        'Прекрасное рабочее место! Чистота, порядок, отличное освещение. Рекомендую!',
        'Замечательное пространство для работы. Удобное расположение, приятная атмосфера.',
        'Все на высшем уровне! Современное оборудование, комфортная обстановка.',
        'Очень довольна! Идеальное место для работы с клиентами.',
      ]
    },
    {
      rating: 4,
      comments: [
        'Хорошее место, но иногда бывает шумно. В целом рекомендую.',
        'Неплохо, но хотелось бы больше розеток. Остальное все отлично!',
        'Качественное место, единственный минус - парковка не всегда удобна.',
        'Хорошее оборудование и чистота. Немного тесновато, но в целом устраивает.',
        'Приятное место, но кондиционер работает слишком сильно. Остальное супер!',
      ]
    },
    {
      rating: 5,
      comments: [
        'Лучший коворкинг для мастеров красоты! Все продумано до мелочей.',
        'Восхитительное место! Клиенты в восторге от атмосферы.',
        'Идеальное соотношение цены и качества. Буду бронировать еще!',
        'Профессиональное оборудование, удобная мебель. Все на 5+!',
        'Превосходное место! Чистота, комфорт, отличный сервис.',
      ]
    },
    {
      rating: 4,
      comments: [
        'Отличное место, но Wi-Fi иногда подводит. В остальном все хорошо.',
        'Хорошее рабочее место, удобное расположение. Немного не хватает зеркал.',
        'Качественное пространство, но хотелось бы больше места для хранения.',
        'Неплохой вариант для работы. Цена адекватная, оборудование хорошее.',
        'Приятное место, но освещение можно было бы улучшить.',
      ]
    },
    {
      rating: 5,
      comments: [
        'Фантастическое место! Все мои клиенты остаются довольны.',
        'Безупречная чистота и порядок. Оборудование первоклассное!',
        'Лучшее место, где я работала! Обязательно вернусь.',
        'Идеальные условия для работы. Рекомендую всем коллегам!',
        'Превосходно! Современное оборудование и уютная атмосфера.',
      ]
    },
    {
      rating: 3,
      comments: [
        'Нормально, но ожидала большего. Цена немного завышена.',
        'Среднее место. Есть и плюсы, и минусы. Попробую еще раз.',
        'Неплохо, но есть куда расти. Оборудование требует обновления.',
      ]
    },
  ];
  
  console.log('Adding reviews...\n');
  
  let reviewCount = 0;
  
  // Add reviews for each workspace
  for (const workspace of workspaces) {
    // Random number of reviews per workspace (3-8)
    const numReviews = Math.floor(Math.random() * 6) + 3;
    
    console.log(`📍 ${workspace.name}: adding ${numReviews} reviews`);
    
    for (let i = 0; i < numReviews; i++) {
      // Pick random user
      const user = allUsers[Math.floor(Math.random() * allUsers.length)];
      
      // Pick random rating category
      const ratingCategory = reviewsData[Math.floor(Math.random() * reviewsData.length)];
      const rating = ratingCategory.rating;
      
      // Pick random comment from that category
      const comment = ratingCategory.comments[Math.floor(Math.random() * ratingCategory.comments.length)];
      
      // Check if user already reviewed this workspace
      const existing = await sql`
        SELECT id FROM reviews 
        WHERE "userId" = ${user.id} AND "workspaceId" = ${workspace.id}
      `;
      
      if (existing.length === 0) {
        await sql`
          INSERT INTO reviews ("workspaceId", "userId", rating, comment, "createdAt", "updatedAt")
          VALUES (${workspace.id}, ${user.id}, ${rating}, ${comment}, NOW(), NOW())
        `;
        
        reviewCount++;
        console.log(`  ✅ ${user.name}: ${rating}⭐ - ${comment.substring(0, 50)}...`);
      }
    }
    
    // Update workspace rating and review count
    const workspaceReviews = await sql`
      SELECT rating FROM reviews WHERE "workspaceId" = ${workspace.id}
    `;
    
    if (workspaceReviews.length > 0) {
      const avgRating = workspaceReviews.reduce((sum, r) => sum + r.rating, 0) / workspaceReviews.length;
      await sql`
        UPDATE workspaces 
        SET rating = ${avgRating.toFixed(1)}, "reviewCount" = ${workspaceReviews.length}
        WHERE id = ${workspace.id}
      `;
      console.log(`  📊 Updated rating: ${avgRating.toFixed(1)} (${workspaceReviews.length} reviews)\n`);
    }
  }
  
  console.log('═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Added ${reviewCount} new reviews`);
  console.log(`👥 From ${allUsers.length} different users`);
  console.log(`📍 Across ${workspaces.length} workspaces`);
  
  // Show rating distribution
  const allReviews = await sql`SELECT rating, COUNT(*) as count FROM reviews GROUP BY rating ORDER BY rating DESC`;
  console.log('\n⭐ Rating distribution:');
  for (const r of allReviews) {
    const stars = '⭐'.repeat(r.rating);
    const bar = '█'.repeat(Math.floor(r.count / 2));
    console.log(`  ${stars} (${r.rating}): ${bar} ${r.count}`);
  }
  
  console.log('\n✅ Reviews added successfully!');
  
} catch (error) {
  console.error('\n❌ Error:', error);
  process.exit(1);
} finally {
  await sql.end();
}
