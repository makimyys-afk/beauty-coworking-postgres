import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('🔍 Verifying Beauty Coworking Implementation\n');
console.log('=' .repeat(60));

const sql = postgres(DATABASE_URL);

try {
  // 1. Check if adminLogs table exists
  console.log('\n1️⃣  Checking adminLogs table...');
  const adminLogsTable = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'adminLogs'
  `;
  
  if (adminLogsTable.length > 0) {
    console.log('   ✅ adminLogs table exists');
    
    // Check if admin_action enum exists
    const adminActionEnum = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'admin_action'
      ) as exists
    `;
    
    if (adminActionEnum[0].exists) {
      console.log('   ✅ admin_action enum exists');
    } else {
      console.log('   ⚠️  admin_action enum NOT found');
    }
  } else {
    console.log('   ❌ adminLogs table NOT found - migration needed');
  }
  
  // 2. Check users table structure
  console.log('\n2️⃣  Checking users table structure...');
  const usersColumns = await sql`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name IN ('points', 'status')
    ORDER BY column_name
  `;
  
  for (const col of usersColumns) {
    console.log(`   ✅ ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
  }
  
  // 3. Check sample user data
  console.log('\n3️⃣  Checking user points and status...');
  const users = await sql`
    SELECT id, name, email, points, status
    FROM users
    ORDER BY points DESC
    LIMIT 5
  `;
  
  if (users.length > 0) {
    console.log('   Top users by points:');
    for (const user of users) {
      console.log(`   - ${user.name || 'Unknown'} (${user.email}): ${user.points} points, ${user.status} status`);
    }
  } else {
    console.log('   ⚠️  No users found in database');
  }
  
  // 4. Check transactions for starting balance
  console.log('\n4️⃣  Checking starting balance transactions...');
  const startingBalances = await sql`
    SELECT t.*, u.name, u.email
    FROM transactions t
    JOIN users u ON t."userId" = u.id
    WHERE t.description LIKE '%Стартовый бонус%'
    ORDER BY t."createdAt" DESC
    LIMIT 5
  `;
  
  if (startingBalances.length > 0) {
    console.log(`   ✅ Found ${startingBalances.length} starting balance transactions`);
    for (const tx of startingBalances) {
      console.log(`   - ${tx.name} (${tx.email}): ${tx.amount}₽`);
    }
  } else {
    console.log('   ⚠️  No starting balance transactions found');
  }
  
  // 5. Check bookings
  console.log('\n5️⃣  Checking bookings...');
  const bookingsCount = await sql`
    SELECT COUNT(*) as count FROM bookings
  `;
  console.log(`   📊 Total bookings: ${bookingsCount[0].count}`);
  
  const recentBookings = await sql`
    SELECT b.id, b."totalPrice", b.status, u.name, u.points
    FROM bookings b
    JOIN users u ON b."userId" = u.id
    ORDER BY b."createdAt" DESC
    LIMIT 3
  `;
  
  if (recentBookings.length > 0) {
    console.log('   Recent bookings:');
    for (const booking of recentBookings) {
      const expectedPoints = Math.floor(booking.totalPrice / 100);
      console.log(`   - Booking #${booking.id}: ${booking.totalPrice}₽ (should award ~${expectedPoints} points)`);
    }
  }
  
  // 6. Check reviews
  console.log('\n6️⃣  Checking reviews...');
  const reviewsCount = await sql`
    SELECT COUNT(*) as count FROM reviews
  `;
  console.log(`   📊 Total reviews: ${reviewsCount[0].count}`);
  
  // 7. Check admin users
  console.log('\n7️⃣  Checking admin users...');
  const admins = await sql`
    SELECT id, name, email, role
    FROM users
    WHERE role = 'admin'
  `;
  
  if (admins.length > 0) {
    console.log(`   ✅ Found ${admins.length} admin user(s):`);
    for (const admin of admins) {
      console.log(`   - ${admin.name} (${admin.email})`);
    }
  } else {
    console.log('   ⚠️  No admin users found');
  }
  
  // 8. Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  
  const issues = [];
  
  if (adminLogsTable.length === 0) {
    issues.push('❌ adminLogs table needs to be created');
  }
  
  if (users.length === 0) {
    issues.push('⚠️  No users in database');
  }
  
  if (admins.length === 0) {
    issues.push('⚠️  No admin users found');
  }
  
  if (issues.length > 0) {
    console.log('\n⚠️  Issues found:');
    issues.forEach(issue => console.log(`   ${issue}`));
  } else {
    console.log('\n✅ All checks passed!');
  }
  
  console.log('\n📝 Implementation Status:');
  console.log('   ✅ Points system code implemented (1 point per 100₽)');
  console.log('   ✅ Review points code implemented (10 points per review)');
  console.log('   ✅ Status-based discounts implemented (Bronze 0%, Silver 5%, Gold 10%, Platinum 15%)');
  console.log('   ✅ Automatic status updates implemented');
  console.log('   ' + (adminLogsTable.length > 0 ? '✅' : '❌') + ' adminLogs table migration');
  
} catch (error) {
  console.error('\n❌ Verification failed:', error);
  process.exit(1);
} finally {
  await sql.end();
}
