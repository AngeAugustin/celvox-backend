import pool from '../config/database.js';

async function migrateAccountNumber() {
  try {
    console.log('Starting migration for account_number field...');

    // Check if column exists
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'accounts' 
       AND COLUMN_NAME = 'account_number'`
    );

    if (columns.length === 0) {
      // Add account_number column
      await pool.execute(
        `ALTER TABLE accounts ADD COLUMN account_number VARCHAR(34) UNIQUE NULL`
      );
      console.log('Added account_number column to accounts table.');

      // Generate account numbers for existing accounts
      const [existingAccounts] = await pool.execute(
        'SELECT id FROM accounts WHERE account_number IS NULL'
      );

      for (const account of existingAccounts) {
        // Generate IBAN-like format: FR76 + 20 digits (simplified)
        const accountNumber = generateAccountNumber(account.id);
        await pool.execute(
          'UPDATE accounts SET account_number = ? WHERE id = ?',
          [accountNumber, account.id]
        );
      }

      console.log(`Generated account numbers for ${existingAccounts.length} existing accounts.`);
    } else {
      console.log('account_number column already exists.');
    }

    console.log('Account number migration completed successfully.');
  } catch (error) {
    console.error('Error during account number migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function generateAccountNumber(accountId) {
  // Generate a unique account number based on account ID
  // Format: IBAN français (FR + 2 check digits + 23 alphanumeric characters)
  // Display format: FR76 XXXX XXXX XXXX XXXX XXXX XXX
  
  // Generate a unique base number from account ID (ensure it's always unique)
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const accountPart = String(accountId).padStart(6, '0');
  const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  // Combine to create 23-character base (alphanumeric)
  const base = `${accountPart}${timestamp}${randomPart}`.padStart(23, '0');
  
  // Generate 2-digit check (simplified - in real IBAN this would be calculated)
  const checkDigits = String(Math.floor(Math.random() * 90) + 10);
  
  // Return in IBAN format (without spaces for storage)
  return `FR${checkDigits}${base}`;
}

migrateAccountNumber();

