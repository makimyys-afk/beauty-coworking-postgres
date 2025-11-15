import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('Connecting to database...');
const sql = postgres(DATABASE_URL);

try {
  // Read the migration file
  const migrationPath = join(__dirname, 'drizzle', '0002_add_admin_logs.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  console.log('Applying migration: 0002_add_admin_logs.sql');
  console.log('Migration content:');
  console.log(migrationSQL);
  console.log('\n---\n');
  
  // Split by statement breakpoint and execute each statement
  const statements = migrationSQL
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 100)}...`);
    await sql.unsafe(statement);
    console.log('✓ Success');
  }
  
  console.log('\n✅ Migration applied successfully!');
  
  // Verify the table was created
  const result = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'adminLogs'
  `;
  
  if (result.length > 0) {
    console.log('✓ adminLogs table exists in database');
  } else {
    console.log('⚠ Warning: adminLogs table not found after migration');
  }
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  await sql.end();
}
