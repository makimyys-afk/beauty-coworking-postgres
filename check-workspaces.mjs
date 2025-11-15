import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

try {
  const rows = await sql`SELECT id, name, type FROM workspaces ORDER BY id`;
  console.log('Workspaces in database:');
  console.table(rows);
} finally {
  await sql.end();
}
