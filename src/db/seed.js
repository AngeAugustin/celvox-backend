import bcrypt from 'bcrypt';
import pool from '../config/database.js';

async function seed() {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const [adminResult] = await pool.execute(
      `INSERT INTO users (email, password_hash, name, role, locale) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE email=email`,
      ['admin@bankapp.com', adminPassword, 'Admin User', 'admin', 'fr']
    );

    let adminUserId;
    if (adminResult.insertId) {
      adminUserId = adminResult.insertId;
    } else {
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        ['admin@bankapp.com']
      );
      adminUserId = existing[0].id;
    }

    // Create default account for admin
    await pool.execute(
      `INSERT INTO accounts (user_id, type, balance, label) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE user_id=user_id`,
      [adminUserId, 'current', 10000.00, 'Compte Principal']
    );

    // Create test user
    const testPassword = await bcrypt.hash('test123', 10);
    const [testResult] = await pool.execute(
      `INSERT INTO users (email, password_hash, name, role, locale) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE email=email`,
      ['test@bankapp.com', testPassword, 'Test User', 'user', 'fr']
    );

    let testUserId;
    if (testResult.insertId) {
      testUserId = testResult.insertId;
    } else {
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        ['test@bankapp.com']
      );
      testUserId = existing[0].id;
    }

    // Create default account for test user
    await pool.execute(
      `INSERT INTO accounts (user_id, type, balance, label) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE user_id=user_id`,
      [testUserId, 'current', 5000.00, 'Compte Principal']
    );

    console.log('✅ Database seeded successfully');
    console.log('Admin: admin@bankapp.com / admin123');
    console.log('Test: test@bankapp.com / test123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

