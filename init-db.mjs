#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import pg from 'postgres';

const execAsync = promisify(exec);

async function initDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    
    // Check if database is accessible
    const sql = pg(process.env.DATABASE_URL, { max: 1 });
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    await sql.end();
    
    if (tables.length === 0) {
      console.log('📦 Database is empty. Running migrations...');
      
      // Run migrations
      console.log('🔄 Running drizzle-kit migrate...');
      await execAsync('pnpm drizzle-kit migrate');
      console.log('✅ Migrations completed');
      
      // Run seed scripts
      console.log('🌱 Seeding database with initial data...');
      await execAsync('node seed-complete.mjs');
      console.log('✅ Seed data inserted');
      
      console.log('🎨 Generating diverse reviews...');
      await execAsync('node generate-reviews-diverse.mjs');
      console.log('✅ Reviews generated');
      
      console.log('🎉 Database initialization completed!');
    } else {
      console.log('✅ Database already initialized with', tables.length, 'tables');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    // Don't throw error to allow app to start even if init fails
    console.log('⚠️  Continuing with app startup...');
  }
}

initDatabase();
