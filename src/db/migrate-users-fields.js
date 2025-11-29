import pool from '../config/database.js';

async function migrateUsersFields() {
  try {
    console.log('Migrating users table to add new fields...');
    
    // Check if columns exist and add them if they don't
    const alterStatements = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(512)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'EUR'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_pay BOOLEAN DEFAULT FALSE",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_pay BOOLEAN DEFAULT FALSE",
    ];

    // MySQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
    // So we'll check first and add only if missing
    for (const statement of alterStatements) {
      try {
        // Extract column name from statement
        const columnMatch = statement.match(/ADD COLUMN IF NOT EXISTS (\w+)/);
        if (columnMatch) {
          const columnName = columnMatch[1];
          
          // Check if column exists
          const [columns] = await pool.execute(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'users' 
             AND COLUMN_NAME = ?`,
            [columnName]
          );
          
          if (columns.length === 0) {
            // Column doesn't exist, add it
            const addStatement = statement.replace(' IF NOT EXISTS', '');
            await pool.execute(addStatement);
            console.log(`✓ Added column: ${columnName}`);
          } else {
            console.log(`- Column ${columnName} already exists`);
          }
        }
      } catch (error) {
        // If column already exists, MySQL will throw an error
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`- Column already exists (skipped)`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateUsersFields();

