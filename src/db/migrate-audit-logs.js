import pool from '../config/database.js';

async function migrateAuditLogs() {
  try {
    console.log('Starting migration for audit_logs fields...');

    // Check if columns exist
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs'`
    );

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    if (!existingColumns.includes('ip')) {
      console.log('Adding ip column to audit_logs table...');
      await pool.execute(
        `ALTER TABLE audit_logs ADD COLUMN ip VARCHAR(45) DEFAULT NULL;`
      );
      console.log('ip column added successfully.');
    }

    if (!existingColumns.includes('country')) {
      console.log('Adding country column to audit_logs table...');
      await pool.execute(
        `ALTER TABLE audit_logs ADD COLUMN country VARCHAR(100) DEFAULT NULL;`
      );
      console.log('country column added successfully.');
    }

    if (!existingColumns.includes('city')) {
      console.log('Adding city column to audit_logs table...');
      await pool.execute(
        `ALTER TABLE audit_logs ADD COLUMN city VARCHAR(100) DEFAULT NULL;`
      );
      console.log('city column added successfully.');
    }

    console.log('Audit logs migration completed successfully.');
  } catch (error) {
    console.error('Error during audit logs migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateAuditLogs();

