import pool from '../config/database.js';
import { auditLog } from './auditService.js';
import { completePendingTransfers } from './transactionService.js';

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

export async function getUserAccounts(userId) {
  const [accounts] = await pool.execute(
    'SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return accounts;
}

export async function getAccountById(accountId, userId) {
  const [accounts] = await pool.execute(
    'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
    [accountId, userId]
  );
  return accounts[0] || null;
}

export async function createAccount(userId, type = 'current', label = null, req = null) {
  // First insert to get the ID
  const [result] = await pool.execute(
    'INSERT INTO accounts (user_id, type, balance, label) VALUES (?, ?, ?, ?)',
    [userId, type, 0, label || `Compte ${type === 'current' ? 'Courant' : 'Épargne'}`]
  );

  const accountId = result.insertId;
  
  // Generate and update account number
  const accountNumber = generateAccountNumber(accountId);
  await pool.execute(
    'UPDATE accounts SET account_number = ? WHERE id = ?',
    [accountNumber, accountId]
  );

  await auditLog(userId, 'account_created', { accountId, type, accountNumber }, null, null, null, req);

  // Note: Pending transfers are now handled via notifications when user logs in
  // Users can accept them manually through the notification system

  // Re-fetch account to get updated balance (in case pending transfers were completed)
  const [account] = await pool.execute(
    'SELECT * FROM accounts WHERE id = ?',
    [accountId]
  );

  return account[0];
}

export async function deleteAccount(accountId, userId, req = null) {
  const account = await getAccountById(accountId, userId);
  if (!account) {
    throw new Error('Account not found');
  }

  if (account.balance !== 0) {
    throw new Error('Cannot delete account with non-zero balance');
  }

  await pool.execute('DELETE FROM accounts WHERE id = ? AND user_id = ?', [accountId, userId]);
  await auditLog(userId, 'account_deleted', { accountId }, null, null, null, req);
}

