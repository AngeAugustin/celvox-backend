import pool from '../config/database.js';
import { auditLog } from './auditService.js';
import { createNotification } from './notificationService.js';
import { sendTransferEmail } from './emailService.js';

// Accept a single pending transfer
export async function acceptPendingTransfer(transactionId, accountId, userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get user email
    const [users] = await connection.execute(
      'SELECT email FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const userEmail = users[0].email;

    // Find the pending transfer
    const [pendingTransfers] = await connection.execute(
      `SELECT t.*, a.user_id as sender_user_id
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ?
       AND t.status = 'pending'
       AND t.type = 'transfer'
       AND t.counterparty_email = ?
       AND t.related_account_id IS NULL`,
      [transactionId, userEmail]
    );

    if (pendingTransfers.length === 0) {
      throw new Error('Pending transfer not found or already processed');
    }

    const pendingTransfer = pendingTransfers[0];

    // Verify the account belongs to the user
    const [accounts] = await connection.execute(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ? FOR UPDATE',
      [accountId, userId]
    );

    if (accounts.length === 0) {
      throw new Error('Account not found or does not belong to user');
    }

    const account = accounts[0];
    const amount = parseFloat(pendingTransfer.amount);
    const fromAccountId = pendingTransfer.account_id;
    const balanceBefore = parseFloat(account.balance);
    const balanceAfter = balanceBefore + amount;

    // Update the account balance
    await connection.execute(
      'UPDATE accounts SET balance = ? WHERE id = ?',
      [balanceAfter, accountId]
    );

    // Create the receiving transaction
    const [toResult] = await connection.execute(
      `INSERT INTO transactions 
       (account_id, related_account_id, type, amount, balance_before, balance_after, 
        status, description, counterparty_email) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        accountId,
        fromAccountId,
        'deposit',
        amount,
        balanceBefore,
        balanceAfter,
        'completed',
        pendingTransfer.description || `Virement reçu`,
        null
      ]
    );

    // Update the original pending transaction to completed
    await connection.execute(
      `UPDATE transactions 
       SET status = 'completed', related_account_id = ?
       WHERE id = ?`,
      [accountId, transactionId]
    );

    await connection.commit();

    // Notify the sender that their transfer was completed
    await createNotification(
      pendingTransfer.sender_user_id,
      'transfer_completed',
      'Virement complété',
      `Votre virement de ${amount.toFixed(2)} EUR à ${userEmail} a été accepté et complété.`,
      { transactionId, toAccountId: accountId, amount }
    );

    // Notify the recipient
    await createNotification(
      userId,
      'transfer_accepted',
      'Virement accepté',
      `Vous avez accepté un virement de ${amount.toFixed(2)} EUR. Le montant a été crédité sur votre compte.`,
      { transactionId, accountId, amount }
    );

    return {
      transactionId: toResult.insertId,
      balanceAfter,
      amount
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Complete pending transfers for a user when they create their first account
export async function completePendingTransfers(userId, accountId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get user email
    const [users] = await connection.execute(
      'SELECT email FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const userEmail = users[0].email;
    console.log(`🔍 Recherche de virements en attente pour l'email: ${userEmail}`);

    // Find all pending transfers sent to this email
    const [pendingTransfers] = await connection.execute(
      `SELECT t.*, a.user_id as sender_user_id, a.balance as sender_balance
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE t.status = 'pending'
       AND t.type = 'transfer'
       AND t.counterparty_email = ?
       AND t.related_account_id IS NULL`,
      [userEmail]
    );

    console.log(`📊 ${pendingTransfers.length} virement(s) en attente trouvé(s)`);

    if (pendingTransfers.length === 0) {
      await connection.commit();
      return { completed: 0, totalAmount: 0 };
    }

    // Get the new account
    const [newAccounts] = await connection.execute(
      'SELECT * FROM accounts WHERE id = ? FOR UPDATE',
      [accountId]
    );

    if (newAccounts.length === 0) {
      throw new Error('Account not found');
    }

    const newAccount = newAccounts[0];
    let currentBalance = parseFloat(newAccount.balance);
    let totalAmount = 0;
    let completedCount = 0;

    // Process each pending transfer
    for (const pendingTransfer of pendingTransfers) {
      const amount = parseFloat(pendingTransfer.amount);
      const fromAccountId = pendingTransfer.account_id;
      const fromTransactionId = pendingTransfer.id;

      console.log(`  💰 Traitement du virement ${fromTransactionId}: ${amount} EUR depuis le compte ${fromAccountId}`);

      // Update the new account balance
      currentBalance += amount;
      totalAmount += amount;

      // Update the new account
      await connection.execute(
        'UPDATE accounts SET balance = ? WHERE id = ?',
        [currentBalance, accountId]
      );
      
      console.log(`  ✅ Solde du compte ${accountId} mis à jour: ${currentBalance.toFixed(2)} EUR`);

      // Create the receiving transaction
      const balanceBefore = currentBalance - amount;
      const [toResult] = await connection.execute(
        `INSERT INTO transactions 
         (account_id, related_account_id, type, amount, balance_before, balance_after, 
          status, description, counterparty_email) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId,
          fromAccountId,
          'deposit',
          amount,
          balanceBefore,
          currentBalance,
          'completed',
          pendingTransfer.description || `Virement reçu`,
          null
        ]
      );

      // Update the original pending transaction to completed
      await connection.execute(
        `UPDATE transactions 
         SET status = 'completed', related_account_id = ?
         WHERE id = ?`,
        [accountId, fromTransactionId]
      );

      // Notify the sender that their transfer was completed
      await createNotification(
        pendingTransfer.sender_user_id,
        'transfer_completed',
        'Virement complété',
        `Votre virement de ${amount} EUR à ${userEmail} a été complété. Le destinataire a créé un compte.`,
        { transactionId: fromTransactionId, toAccountId: accountId, amount }
      );

      completedCount++;
    }

    await connection.commit();

    // Notify the recipient about all completed transfers
    if (completedCount > 0) {
      await createNotification(
        userId,
        'pending_transfers_completed',
        'Virements reçus',
        `Vous avez reçu ${completedCount} virement(s) totalisant ${totalAmount.toFixed(2)} EUR sur votre nouveau compte.`,
        { accountId, completedCount, totalAmount }
      );
    }

    return { completed: completedCount, totalAmount };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const MAX_DAILY_TRANSFER = parseFloat(process.env.MAX_DAILY_TRANSFER || '5000');
const ALLOW_OVERDRAFT = process.env.ALLOW_OVERDRAFT === 'true';

export async function getTransactions(userId, filters = {}) {
  const { accountId, type, from, to, limit = 50, offset = 0 } = filters;
  
  let query = `
    SELECT t.*, a.type as account_type, a.label as account_label
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    WHERE a.user_id = ?
  `;
  const params = [userId];

  if (accountId) {
    query += ' AND t.account_id = ?';
    params.push(accountId);
  }

  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }

  if (from) {
    query += ' AND t.created_at >= ?';
    params.push(from);
  }

  if (to) {
    query += ' AND t.created_at <= ?';
    params.push(to);
  }

  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const [transactions] = await pool.execute(query, params);
  return transactions;
}

export async function getTransactionById(transactionId, userId) {
  const [transactions] = await pool.execute(
    `SELECT t.*, a.type as account_type, a.label as account_label
     FROM transactions t
     JOIN accounts a ON t.account_id = a.id
     WHERE t.id = ? AND a.user_id = ?`,
    [transactionId, userId]
  );
  return transactions[0] || null;
}

async function checkDailyLimit(accountId, amount, date) {
  const [result] = await pool.execute(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE account_id = ?
     AND type = 'transfer'
     AND DATE(created_at) = DATE(?)
     AND status = 'completed'`,
    [accountId, date]
  );

  const dailyTotal = parseFloat(result[0].total || 0);
  if (dailyTotal + amount > MAX_DAILY_TRANSFER) {
    throw new Error(`Daily transfer limit exceeded. Maximum: ${MAX_DAILY_TRANSFER} EUR`);
  }
}

export async function deposit(accountId, amount, description, userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get account
    const [accounts] = await connection.execute(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ? FOR UPDATE',
      [accountId, userId]
    );

    if (accounts.length === 0) {
      throw new Error('Account not found');
    }

    const account = accounts[0];
    const balanceBefore = parseFloat(account.balance);
    const balanceAfter = balanceBefore + parseFloat(amount);

    // Update balance
    await connection.execute(
      'UPDATE accounts SET balance = ? WHERE id = ?',
      [balanceAfter, accountId]
    );

    // Create transaction
    const [result] = await connection.execute(
      `INSERT INTO transactions 
       (account_id, type, amount, balance_before, balance_after, status, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [accountId, 'deposit', amount, balanceBefore, balanceAfter, 'completed', description]
    );

    await connection.commit();

    await auditLog(userId, 'deposit', { accountId, amount, transactionId: result.insertId }, null, null, null, null);

    return { id: result.insertId, balanceAfter };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function withdraw(accountId, amount, description, userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get account
    const [accounts] = await connection.execute(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ? FOR UPDATE',
      [accountId, userId]
    );

    if (accounts.length === 0) {
      throw new Error('Account not found');
    }

    const account = accounts[0];
    const balanceBefore = parseFloat(account.balance);
    const balanceAfter = balanceBefore - parseFloat(amount);

    if (balanceAfter < 0 && !ALLOW_OVERDRAFT) {
      throw new Error('Insufficient funds');
    }

    // Update balance
    await connection.execute(
      'UPDATE accounts SET balance = ? WHERE id = ?',
      [balanceAfter, accountId]
    );

    // Create transaction
    const [result] = await connection.execute(
      `INSERT INTO transactions 
       (account_id, type, amount, balance_before, balance_after, status, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [accountId, 'withdrawal', amount, balanceBefore, balanceAfter, 'completed', description]
    );

    await connection.commit();

    await auditLog(userId, 'withdrawal', { accountId, amount, transactionId: result.insertId }, null, null, null, null);

    return { id: result.insertId, balanceAfter };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function transfer(fromAccountId, toEmail, toAccountId, amount, description, userId, toAccountNumber = null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get source account
    const [fromAccounts] = await connection.execute(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ? FOR UPDATE',
      [fromAccountId, userId]
    );

    if (fromAccounts.length === 0) {
      throw new Error('Source account not found');
    }

    const fromAccount = fromAccounts[0];
    const balanceBefore = parseFloat(fromAccount.balance);
    const balanceAfter = balanceBefore - parseFloat(amount);

    if (balanceAfter < 0 && !ALLOW_OVERDRAFT) {
      throw new Error('Insufficient funds');
    }

    // Check daily limit
    await checkDailyLimit(fromAccountId, amount, new Date());

    let toAccount = null;
    let recipientUserId = null;

    if (toAccountId) {
      // Internal transfer by account ID
      const [toAccounts] = await connection.execute(
        'SELECT * FROM accounts WHERE id = ? FOR UPDATE',
        [toAccountId]
      );
      if (toAccounts.length === 0) {
        throw new Error('Destination account not found');
      }
      toAccount = toAccounts[0];
      recipientUserId = toAccount.user_id;
    } else if (toAccountNumber) {
      // Internal transfer by account number
      // Remove spaces from account number for comparison
      const cleanedAccountNumber = toAccountNumber.replace(/\s/g, '');
      const [toAccounts] = await connection.execute(
        'SELECT * FROM accounts WHERE REPLACE(account_number, " ", "") = ? FOR UPDATE',
        [cleanedAccountNumber]
      );
      if (toAccounts.length === 0) {
        throw new Error('Destination account not found');
      }
      toAccount = toAccounts[0];
      toAccountId = toAccount.id;
      recipientUserId = toAccount.user_id;
    } else if (toEmail) {
      // Transfer by email
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [toEmail]
      );

      if (users.length > 0) {
        // User exists - find user's primary account
        recipientUserId = users[0].id;
        const [recipientAccounts] = await connection.execute(
          'SELECT * FROM accounts WHERE user_id = ? AND type = "current" LIMIT 1 FOR UPDATE',
          [recipientUserId]
        );
        if (recipientAccounts.length > 0) {
          toAccount = recipientAccounts[0];
          toAccountId = toAccount.id;
        }
        // If user exists but has no account, toAccount remains null -> status will be 'pending'
      }
      // If user doesn't exist, toAccount is null -> status will be 'pending'
    }

    // Update source account
    await connection.execute(
      'UPDATE accounts SET balance = ? WHERE id = ?',
      [balanceAfter, fromAccountId]
    );

    // Create source transaction
    const [fromResult] = await connection.execute(
      `INSERT INTO transactions 
       (account_id, related_account_id, type, amount, balance_before, balance_after, 
        status, description, counterparty_email) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fromAccountId,
        toAccountId || null,
        'transfer',
        amount,
        balanceBefore,
        balanceAfter,
        toAccount ? 'completed' : 'pending',
        description,
        toEmail || null
      ]
    );

    let toResult = null;

    if (toAccount) {
      // Update destination account
      const toBalanceBefore = parseFloat(toAccount.balance);
      const toBalanceAfter = toBalanceBefore + parseFloat(amount);

      await connection.execute(
        'UPDATE accounts SET balance = ? WHERE id = ?',
        [toBalanceAfter, toAccountId]
      );

      // Create destination transaction
      [toResult] = await connection.execute(
        `INSERT INTO transactions 
         (account_id, related_account_id, type, amount, balance_before, balance_after, 
          status, description, counterparty_email) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          toAccountId,
          fromAccountId,
          'transfer',
          amount,
          toBalanceBefore,
          toBalanceAfter,
          'completed',
          description,
          null
        ]
      );

      // Notify recipient
      await createNotification(
        recipientUserId,
        'transfer_received',
        'Virement reçu',
        `Vous avez reçu ${amount} EUR`,
        { transactionId: toResult.insertId, amount, fromAccountId }
      );
    } else {
      // External transfer - send email
      if (toEmail) {
        // Get sender information
        const [senderUsers] = await connection.execute(
          'SELECT name, email FROM users WHERE id = ?',
          [userId]
        );
        const sender = senderUsers[0] || {};
        
        await sendTransferEmail(
          toEmail, 
          amount, 
          description,
          sender.name || null,
          sender.email || null
        );
      }
    }

    await connection.commit();

    await auditLog(userId, 'transfer', {
      fromAccountId,
      toAccountId,
      toEmail,
      amount,
      transactionId: fromResult.insertId
    }, null, null, null, null);

    // Notify sender
    await createNotification(
      userId,
      'transfer_sent',
      'Virement envoyé',
      `Virement de ${amount} EUR ${toAccount ? 'effectué' : 'en attente'}`,
      { transactionId: fromResult.insertId, amount }
    );

    return {
      id: fromResult.insertId,
      balanceAfter,
      relatedTransactionId: toResult?.insertId,
      isExternal: !toAccount
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Admin transfer - allows transferring between any accounts without ownership check
export async function adminTransfer(fromAccountId, toAccountId, amount, description, adminUserId, req = null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get source account (no user_id check for admin)
    const [fromAccounts] = await connection.execute(
      'SELECT * FROM accounts WHERE id = ? FOR UPDATE',
      [fromAccountId]
    );

    if (fromAccounts.length === 0) {
      throw new Error('Source account not found');
    }

    const fromAccount = fromAccounts[0];
    const balanceBefore = parseFloat(fromAccount.balance);
    const balanceAfter = balanceBefore - parseFloat(amount);

    if (balanceAfter < 0 && !ALLOW_OVERDRAFT) {
      throw new Error('Insufficient funds in source account');
    }

    // Get destination account
    const [toAccounts] = await connection.execute(
      'SELECT * FROM accounts WHERE id = ? FOR UPDATE',
      [toAccountId]
    );

    if (toAccounts.length === 0) {
      throw new Error('Destination account not found');
    }

    const toAccount = toAccounts[0];
    const toBalanceBefore = parseFloat(toAccount.balance);
    const toBalanceAfter = toBalanceBefore + parseFloat(amount);

    // Update source account
    await connection.execute(
      'UPDATE accounts SET balance = ? WHERE id = ?',
      [balanceAfter, fromAccountId]
    );

    // Update destination account
    await connection.execute(
      'UPDATE accounts SET balance = ? WHERE id = ?',
      [toBalanceAfter, toAccountId]
    );

    // Create source transaction
    const [fromResult] = await connection.execute(
      `INSERT INTO transactions 
       (account_id, related_account_id, type, amount, balance_before, balance_after, 
        status, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fromAccountId,
        toAccountId,
        'transfer',
        amount,
        balanceBefore,
        balanceAfter,
        'completed',
        description || `Admin transfer to account ${toAccountId}`
      ]
    );

    // Create destination transaction
    const [toResult] = await connection.execute(
      `INSERT INTO transactions 
       (account_id, related_account_id, type, amount, balance_before, balance_after, 
        status, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        toAccountId,
        fromAccountId,
        'deposit',
        amount,
        toBalanceBefore,
        toBalanceAfter,
        'completed',
        description || `Admin transfer from account ${fromAccountId}`
      ]
    );

    await connection.commit();

    // Audit log
    await auditLog(adminUserId, 'admin_transfer_created', {
      fromAccountId,
      toAccountId,
      amount,
      fromTransactionId: fromResult.insertId,
      toTransactionId: toResult.insertId
    }, req);

    // Notify both users
    await createNotification(
      fromAccount.user_id,
      'admin_transfer',
      'Virement administrateur',
      `Un virement de ${amount} EUR a été effectué depuis votre compte`,
      { transactionId: fromResult.insertId, amount, toAccountId }
    );

    await createNotification(
      toAccount.user_id,
      'admin_transfer',
      'Virement administrateur',
      `Un virement de ${amount} EUR a été effectué vers votre compte`,
      { transactionId: toResult.insertId, amount, fromAccountId }
    );

    return {
      fromTransactionId: fromResult.insertId,
      toTransactionId: toResult.insertId,
      fromBalanceAfter: balanceAfter,
      toBalanceAfter: toBalanceAfter
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

