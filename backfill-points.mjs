import postgres from 'postgres';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.log('\nUsage:');
  console.log('  export DATABASE_URL="postgresql://user:password@host:port/database"');
  console.log('  node backfill-points.mjs');
  process.exit(1);
}

console.log('🔄 Backfilling points for existing bookings and reviews...\n');
console.log('=' .repeat(60));

const sql = postgres(DATABASE_URL);

try {
  // Step 1: Calculate points from existing bookings
  console.log('\n1️⃣  Calculating points from bookings...');
  
  const bookingsWithPoints = await sql`
    SELECT 
      "userId",
      COUNT(*) as booking_count,
      SUM(FLOOR("totalPrice" / 100)) as total_points
    FROM bookings
    GROUP BY "userId"
    ORDER BY total_points DESC
  `;
  
  console.log(`   Found ${bookingsWithPoints.length} users with bookings`);
  
  // Step 2: Calculate points from existing reviews
  console.log('\n2️⃣  Calculating points from reviews...');
  
  const reviewsWithPoints = await sql`
    SELECT 
      "userId",
      COUNT(*) as review_count,
      COUNT(*) * 10 as total_points
    FROM reviews
    GROUP BY "userId"
    ORDER BY total_points DESC
  `;
  
  console.log(`   Found ${reviewsWithPoints.length} users with reviews`);
  
  // Step 3: Combine points from bookings and reviews
  console.log('\n3️⃣  Combining points...');
  
  const userPointsMap = new Map();
  
  // Add booking points
  for (const row of bookingsWithPoints) {
    userPointsMap.set(row.userId, {
      userId: row.userId,
      bookingPoints: Number(row.total_points) || 0,
      reviewPoints: 0,
      bookingCount: Number(row.booking_count) || 0,
      reviewCount: 0
    });
  }
  
  // Add review points
  for (const row of reviewsWithPoints) {
    if (userPointsMap.has(row.userId)) {
      const user = userPointsMap.get(row.userId);
      user.reviewPoints = Number(row.total_points) || 0;
      user.reviewCount = Number(row.review_count) || 0;
    } else {
      userPointsMap.set(row.userId, {
        userId: row.userId,
        bookingPoints: 0,
        reviewPoints: Number(row.total_points) || 0,
        bookingCount: 0,
        reviewCount: Number(row.review_count) || 0
      });
    }
  }
  
  console.log(`   Total users to update: ${userPointsMap.size}`);
  
  // Step 4: Update user points and status
  console.log('\n4️⃣  Updating user points and status...\n');
  
  let updatedCount = 0;
  const updates = [];
  
  for (const [userId, data] of userPointsMap) {
    const totalPoints = data.bookingPoints + data.reviewPoints;
    
    // Determine new status based on points
    let newStatus = 'bronze';
    if (totalPoints >= 1500) {
      newStatus = 'gold';
    } else if (totalPoints >= 750) {
      newStatus = 'silver';
    }
    
    // Get user info
    const [user] = await sql`
      SELECT id, name, email, points, status
      FROM users
      WHERE id = ${userId}
    `;
    
    if (user) {
      // Update user points and status
      await sql`
        UPDATE users
        SET 
          points = ${totalPoints},
          status = ${newStatus}::status
        WHERE id = ${userId}
      `;
      
      updatedCount++;
      
      const statusEmoji = {
        'bronze': '🥉',
        'silver': '🥈',
        'gold': '🥇'
      };
      
      console.log(`   ${statusEmoji[newStatus]} ${user.name || 'Unknown'} (${user.email})`);
      console.log(`      Old: ${user.points || 0} points, ${user.status} status`);
      console.log(`      New: ${totalPoints} points, ${newStatus} status`);
      console.log(`      From: ${data.bookingCount} bookings (${data.bookingPoints} pts) + ${data.reviewCount} reviews (${data.reviewPoints} pts)`);
      console.log('');
      
      updates.push({
        userId,
        name: user.name,
        email: user.email,
        oldPoints: user.points || 0,
        newPoints: totalPoints,
        oldStatus: user.status,
        newStatus: newStatus,
        bookingCount: data.bookingCount,
        reviewCount: data.reviewCount
      });
    }
  }
  
  // Step 5: Summary
  console.log('=' .repeat(60));
  console.log('📊 BACKFILL SUMMARY');
  console.log('=' .repeat(60));
  console.log(`\n✅ Updated ${updatedCount} users`);
  
  const statusCounts = {
    bronze: updates.filter(u => u.newStatus === 'bronze').length,
    silver: updates.filter(u => u.newStatus === 'silver').length,
    gold: updates.filter(u => u.newStatus === 'gold').length
  };
  
  console.log('\n📈 Status distribution:');
  console.log(`   🥉 Bronze: ${statusCounts.bronze} users`);
  console.log(`   🥈 Silver: ${statusCounts.silver} users`);
  console.log(`   🥇 Gold: ${statusCounts.gold} users`);
  
  const totalPointsAwarded = updates.reduce((sum, u) => sum + u.newPoints, 0);
  console.log(`\n🎯 Total points awarded: ${totalPointsAwarded}`);
  
  // Save detailed report
  const reportPath = '/home/ubuntu/backfill-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(updates, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  console.log('\n✅ Backfill completed successfully!');
  console.log('\n💡 Next steps:');
  console.log('   1. Check the application - users should now see their points');
  console.log('   2. Users with Silver/Gold status will get discounts on next booking');
  console.log('   3. New bookings and reviews will continue to award points automatically');
  
} catch (error) {
  console.error('\n❌ Backfill failed:', error);
  console.error('\nError details:', error.message);
  process.exit(1);
} finally {
  await sql.end();
}
