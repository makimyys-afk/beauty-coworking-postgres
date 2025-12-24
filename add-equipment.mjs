import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('🔧 Adding equipment information to workspaces...\n');

const sql = postgres(DATABASE_URL);

try {
  // First, apply the migration
  console.log('📋 Applying migration...');
  await sql.file('/home/ubuntu/beauty-coworking-postgres/drizzle/0003_add_equipment.sql');
  console.log('✅ Migration applied\n');
  
  // Equipment data for each workspace type
  const workspaceEquipment = {
    'Парикмахерское место №1': [
      { name: 'Профессиональный фен', brand: 'Dyson', model: 'Supersonic' },
      { name: 'Утюжок для волос', brand: 'GHD', model: 'Platinum+' },
      { name: 'Плойка', brand: 'BaByliss', model: 'Pro' },
      { name: 'Парикмахерское кресло', brand: 'Takara Belmont', model: 'Apollo 2' },
      { name: 'Зеркало с LED-подсветкой', brand: 'Cantoni' },
      { name: 'Профессиональные ножницы', brand: 'Jaguar', model: 'Pre Style Ergo' },
      { name: 'Машинка для стрижки', brand: 'Wahl', model: 'Magic Clip' },
      { name: 'Стерилизатор', brand: 'Germix' },
    ],
    
    'Место визажиста №1': [
      { name: 'Кольцевая лампа', brand: 'Neewer', model: 'RL-18' },
      { name: 'Зеркало для макияжа', brand: 'Simplehuman', model: 'Sensor' },
      { name: 'Набор кистей для макияжа', brand: 'Sigma Beauty', model: 'Essential Kit' },
      { name: 'Палитра для смешивания', brand: 'Graftobian' },
      { name: 'Визажный стул', brand: 'Director Chair' },
      { name: 'Органайзер для косметики', brand: 'Glamcor' },
      { name: 'Стерилизатор UV', brand: 'Germix' },
    ],
    
    'Маникюрный стол №1': [
      { name: 'Маникюрный стол с вытяжкой', brand: 'Teri', model: 'Turbo Smart' },
      { name: 'UV/LED лампа для сушки', brand: 'Sun', model: 'Sun5 Plus' },
      { name: 'Фрезер для маникюра', brand: 'Strong', model: '210/105L' },
      { name: 'Стерилизатор', brand: 'Jessnail', model: 'SD-9007' },
      { name: 'Маникюрное кресло для клиента', brand: 'Panda' },
      { name: 'Настольная лампа', brand: 'Lucia', model: 'L-360' },
      { name: 'Набор пилок и баффов', brand: 'Staleks Pro' },
    ],
    
    'Кабинет косметолога №1': [
      { name: 'Косметологическая кушетка', brand: 'Tico Professional', model: 'Comfort' },
      { name: 'Лампа-лупа', brand: 'Moonlight', model: '8066D' },
      { name: 'Вапоризатор', brand: 'Gezatone', model: 'Ionic-Steamer' },
      { name: 'Аппарат для ультразвуковой чистки', brand: 'Skin Scrubber' },
      { name: 'Дарсонваль', brand: 'Gezatone', model: 'BT-101' },
      { name: 'Стерилизатор', brand: 'Sanitec', model: 'SD-9007' },
      { name: 'Тележка для инструментов', brand: 'Beauty' },
      { name: 'Кресло косметолога', brand: 'Comfort' },
    ],
    
    'Массажный кабинет №1': [
      { name: 'Массажный стол', brand: 'Yamaguchi', model: 'Vancouver' },
      { name: 'Подогреватель полотенец', brand: 'Harizma', model: 'h10318' },
      { name: 'Инфракрасная лампа', brand: 'Beurer', model: 'IL 50' },
      { name: 'Массажер ручной', brand: 'Medisana', model: 'HM 858' },
      { name: 'Аромадиффузор', brand: 'Stadler Form', model: 'Jasmine' },
      { name: 'Стерилизатор UV', brand: 'Germix' },
      { name: 'Массажные валики', brand: 'Casada' },
    ],
  };
  
  console.log('🔧 Updating workspaces with equipment data...\n');
  
  for (const [workspaceName, equipment] of Object.entries(workspaceEquipment)) {
    const equipmentJson = JSON.stringify(equipment);
    
    const result = await sql`
      UPDATE workspaces 
      SET equipment = ${equipmentJson}
      WHERE name = ${workspaceName}
      RETURNING id, name
    `;
    
    if (result.length > 0) {
      console.log(`✅ ${workspaceName}`);
      console.log(`   📦 Added ${equipment.length} equipment items:`);
      equipment.forEach(item => {
        const modelStr = item.model ? ` ${item.model}` : '';
        console.log(`      • ${item.name} - ${item.brand}${modelStr}`);
      });
      console.log('');
    } else {
      console.log(`⚠️  Workspace not found: ${workspaceName}\n`);
    }
  }
  
  console.log('═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  
  const workspaces = await sql`SELECT id, name FROM workspaces WHERE equipment IS NOT NULL`;
  console.log(`✅ Updated ${workspaces.length} workspaces with equipment information`);
  
  console.log('\n✅ Equipment data added successfully!');
  
} catch (error) {
  console.error('\n❌ Error:', error);
  process.exit(1);
} finally {
  await sql.end();
}
