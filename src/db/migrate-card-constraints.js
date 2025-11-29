import pool from '../config/database.js';

async function migrateCardConstraints() {
  try {
    console.log('Starting migration for card constraints...');

    // Check if column already exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'cards' 
      AND COLUMN_NAME = 'deactivated_at'
    `);

    if (columns.length === 0) {
      // Add deactivated_at column to track when a card was deactivated
      await pool.execute(`
        ALTER TABLE cards 
        ADD COLUMN deactivated_at TIMESTAMP NULL DEFAULT NULL
      `);
      console.log('Added deactivated_at column to cards table.');
    } else {
      console.log('deactivated_at column already exists.');
    }

    console.log('Card constraints migration completed successfully.');
  } catch (error) {
    console.error('Error during card constraints migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateCardConstraints();

