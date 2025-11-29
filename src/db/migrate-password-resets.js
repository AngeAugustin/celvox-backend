import pool from '../config/database.js';

async function migratePasswordResets() {
  try {
    console.log('Creating password_resets table...');
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_code (code),
        INDEX idx_expires_at (expires_at)
      )
    `);
    
    console.log('✅ password_resets table created successfully');
    await pool.end();
  } catch (error) {
    console.error('❌ Error creating password_resets table:', error);
    await pool.end();
    process.exit(1);
  }
}

migratePasswordResets();

