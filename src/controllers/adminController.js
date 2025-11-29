import pool from '../config/database.js';
import { auditLog } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { adminTransfer } from '../services/transactionService.js';
import bcrypt from 'bcrypt';

// Dashboard Statistics
export async function getDashboardStats(req, res) {
  try {
    // Total users
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    const totalUsers = userCount[0].count;

    // Total accounts
    const [accountCount] = await pool.execute('SELECT COUNT(*) as count FROM accounts');
    const totalAccounts = accountCount[0].count;

    // Total balance
    const [balanceResult] = await pool.execute('SELECT SUM(balance) as total FROM accounts');
    const totalBalance = parseFloat(balanceResult[0].total || 0);

    // Total transactions
    const [txCount] = await pool.execute('SELECT COUNT(*) as count FROM transactions');
    const totalTransactions = txCount[0].count;

    // Transactions today
    const [txToday] = await pool.execute(
      'SELECT COUNT(*) as count FROM transactions WHERE DATE(created_at) = CURDATE()'
    );
    const transactionsToday = txToday[0].count;

    // Transactions this month
    const [txMonth] = await pool.execute(
      'SELECT COUNT(*) as count FROM transactions WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())'
    );
    const transactionsMonth = txMonth[0].count;

    // Total cards
    const [cardCount] = await pool.execute('SELECT COUNT(*) as count FROM cards');
    const totalCards = cardCount[0].count;

    // Active cards
    const [activeCardCount] = await pool.execute('SELECT COUNT(*) as count FROM cards WHERE is_active = TRUE');
    const activeCards = activeCardCount[0].count;

    // Recent transactions (last 10)
    const [recentTx] = await pool.execute(
      `SELECT t.*, a.user_id, u.name as user_name, u.email as user_email
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       JOIN users u ON a.user_id = u.id
       ORDER BY t.created_at DESC
       LIMIT 10`
    );

    // New users this month
    const [newUsersMonth] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND role = "user"'
    );
    const newUsersThisMonth = newUsersMonth[0].count;

    res.json({
      stats: {
        totalUsers,
        totalAccounts,
        totalBalance,
        totalTransactions,
        transactionsToday,
        transactionsMonth,
        totalCards,
        activeCards,
        newUsersThisMonth
      },
      recentTransactions: recentTx
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get all users with search and filters
export async function getUsers(req, res) {
  try {
    const { limit = 50, offset = 0, search, role } = req.query;
    
    let query = `SELECT id, email, name, locale, role, created_at, phone, city, country 
                 FROM users WHERE 1=1`;
    const params = [];

    if (search) {
      query += ' AND (email LIKE ? OR name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const countParams = [];
    if (search) {
      countQuery += ' AND (email LIKE ? OR name LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].count;

    res.json({ users, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get user by ID with details
export async function getUserById(req, res) {
  try {
    const userId = parseInt(req.params.id);
    
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get user accounts
    const [accounts] = await pool.execute(
      'SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Get user cards
    const [cards] = await pool.execute(
      `SELECT c.*, a.label as account_label, a.account_number as account_number
       FROM cards c
       JOIN accounts a ON c.account_id = a.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );

    // Get user transactions
    const [transactions] = await pool.execute(
      `SELECT t.*, a.type as account_type, a.label as account_label, a.account_number as account_number
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE a.user_id = ?
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [userId]
    );

    // Get user transactions count
    const [txCount] = await pool.execute(
      `SELECT COUNT(*) as count FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE a.user_id = ?`,
      [userId]
    );

    // Get total balance
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    res.json({
      user,
      accounts,
      cards,
      transactions,
      stats: {
        totalAccounts: accounts.length,
        totalCards: cards.length,
        totalTransactions: txCount[0].count,
        totalBalance
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update user
export async function updateUser(req, res) {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, phone, address, city, state, zip_code, country, locale, role } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (zip_code !== undefined) updates.zip_code = zip_code;
    if (country !== undefined) updates.country = country;
    if (locale !== undefined) updates.locale = locale;
    if (role !== undefined) updates.role = role;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(userId);

    await pool.execute(
      `UPDATE users SET ${fields} WHERE id = ?`,
      values
    );

    await auditLog(req.user.id, 'admin_user_updated', { userId, updates }, req.clientIp, null, null, req);

    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Reset user password
export async function resetUserPassword(req, res) {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);

    await auditLog(req.user.id, 'admin_password_reset', { userId }, req.clientIp, null, null, req);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get all accounts
export async function getAllAccounts(req, res) {
  try {
    const { limit = 50, offset = 0, search, type, userId } = req.query;
    
    let query = `SELECT a.*, u.name as user_name, u.email as user_email 
                 FROM accounts a
                 JOIN users u ON a.user_id = u.id
                 WHERE 1=1`;
    const params = [];

    if (search) {
      query += ' AND (u.email LIKE ? OR u.name LIKE ? OR a.label LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (type) {
      query += ' AND a.type = ?';
      params.push(type);
    }

    if (userId) {
      query += ' AND a.user_id = ?';
      params.push(parseInt(userId));
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [accounts] = await pool.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM accounts a
                      JOIN users u ON a.user_id = u.id
                      WHERE 1=1`;
    const countParams = [];
    if (search) {
      countQuery += ' AND (u.email LIKE ? OR u.name LIKE ? OR a.label LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    if (type) {
      countQuery += ' AND a.type = ?';
      countParams.push(type);
    }
    if (userId) {
      countQuery += ' AND a.user_id = ?';
      countParams.push(parseInt(userId));
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].count;

    res.json({ accounts, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get account by ID
export async function getAccountById(req, res) {
  try {
    const accountId = parseInt(req.params.id);
    
    const [accounts] = await pool.execute(
      `SELECT a.*, u.name as user_name, u.email as user_email 
       FROM accounts a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [accountId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accounts[0];

    // Get transactions
    const [transactions] = await pool.execute(
      'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT 50',
      [accountId]
    );

    res.json({ account, transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update account (admin adjustment)
export async function updateAccount(req, res) {
  try {
    const accountId = parseInt(req.params.id);
    const { balance, label, type } = req.body;

    const updates = {};
    if (balance !== undefined) updates.balance = balance;
    if (label !== undefined) updates.label = label;
    if (type !== undefined) updates.type = type;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Get current account
    const [accounts] = await pool.execute('SELECT * FROM accounts WHERE id = ?', [accountId]);
    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const oldBalance = parseFloat(accounts[0].balance);
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(accountId);

    await pool.execute(
      `UPDATE accounts SET ${fields} WHERE id = ?`,
      values
    );

    // If balance changed, create audit log
    if (balance !== undefined && balance !== oldBalance) {
      await auditLog(req.user.id, 'admin_balance_adjustment', {
        accountId,
        oldBalance,
        newBalance: balance,
        adjustment: parseFloat(balance) - oldBalance
      }, req.clientIp, null, null, req);
    }

    const [updatedAccounts] = await pool.execute('SELECT * FROM accounts WHERE id = ?', [accountId]);
    res.json({ account: updatedAccounts[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create account for user
export async function createAccountForUser(req, res) {
    try {
      const { userId, type, label, initialBalance } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Verify user exists
      const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Use the accountService to create account (which handles pending transfers)
      const { createAccount } = await import('../services/accountService.js');
      const account = await createAccount(userId, type || 'current', label || null, req);

      // If initialBalance is specified and different from 0, update it
      if (initialBalance && parseFloat(initialBalance) !== 0) {
        const currentBalance = parseFloat(account.balance || 0);
        const newBalance = currentBalance + parseFloat(initialBalance);
        await pool.execute(
          'UPDATE accounts SET balance = ? WHERE id = ?',
          [newBalance, account.id]
        );
        account.balance = newBalance;
      }

      await auditLog(req.user.id, 'admin_account_created', {
        accountId: account.id,
        userId,
        type: type || 'current',
        accountNumber: account.account_number
      }, req.clientIp, null, null, req);

      res.status(201).json({ account });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
}

// Get all transactions
export async function getAllTransactions(req, res) {
  try {
    const { limit = 50, offset = 0, search, type, status, from, to, userId } = req.query;
    
    let query = `SELECT t.*, a.user_id, a.type as account_type, a.label as account_label,
                        u.name as user_name, u.email as user_email
                 FROM transactions t
                 JOIN accounts a ON t.account_id = a.id
                 JOIN users u ON a.user_id = u.id
                 WHERE 1=1`;
    const params = [];

    if (search) {
      query += ' AND (u.email LIKE ? OR u.name LIKE ? OR t.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (from) {
      query += ' AND t.created_at >= ?';
      params.push(from);
    }

    if (to) {
      query += ' AND t.created_at <= ?';
      params.push(to);
    }

    if (userId) {
      query += ' AND a.user_id = ?';
      params.push(parseInt(userId));
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [transactions] = await pool.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM transactions t
                      JOIN accounts a ON t.account_id = a.id
                      JOIN users u ON a.user_id = u.id
                      WHERE 1=1`;
    const countParams = [];
    if (search) {
      countQuery += ' AND (u.email LIKE ? OR u.name LIKE ? OR t.description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    if (type) {
      countQuery += ' AND t.type = ?';
      countParams.push(type);
    }
    if (status) {
      countQuery += ' AND t.status = ?';
      countParams.push(status);
    }
    if (from) {
      countQuery += ' AND t.created_at >= ?';
      countParams.push(from);
    }
    if (to) {
      countQuery += ' AND t.created_at <= ?';
      countParams.push(to);
    }
    if (userId) {
      countQuery += ' AND a.user_id = ?';
      countParams.push(parseInt(userId));
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].count;

    res.json({ transactions, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get all cards
export async function getAllCards(req, res) {
  try {
    const { limit = 50, offset = 0, search, isActive, userId } = req.query;
    
    let query = `SELECT c.*, a.user_id, a.type as account_type, a.label as account_label, a.account_number as account_number,
                        u.name as user_name, u.email as user_email
                 FROM cards c
                 JOIN accounts a ON c.account_id = a.id
                 JOIN users u ON a.user_id = u.id
                 WHERE 1=1`;
    const params = [];

    if (search) {
      query += ' AND (u.email LIKE ? OR u.name LIKE ? OR c.label LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (isActive !== undefined) {
      query += ' AND c.is_active = ?';
      params.push(isActive === 'true');
    }

    if (userId) {
      query += ' AND a.user_id = ?';
      params.push(parseInt(userId));
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [cards] = await pool.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM cards c
                      JOIN accounts a ON c.account_id = a.id
                      JOIN users u ON a.user_id = u.id
                      WHERE 1=1`;
    const countParams = [];
    if (search) {
      countQuery += ' AND (u.email LIKE ? OR u.name LIKE ? OR c.label LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    if (isActive !== undefined) {
      countQuery += ' AND c.is_active = ?';
      countParams.push(isActive === 'true');
    }
    if (userId) {
      countQuery += ' AND a.user_id = ?';
      countParams.push(parseInt(userId));
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].count;

    res.json({ cards, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Send notification
export async function sendNotification(req, res) {
  try {
    const { userId, type, title, body, data } = req.body;

    if (!userId || !type || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await createNotification(userId, type, title, body, data || {});
    await auditLog(req.user.id, 'admin_notification_sent', { userId, type }, req.clientIp, null, null, req);

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create transfer between accounts (admin)
export async function createTransfer(req, res) {
  try {
    const { fromAccountId, toAccountId, amount, description } = req.body;

    // Convert to proper types
    const fromId = typeof fromAccountId === 'string' ? parseInt(fromAccountId) : fromAccountId;
    const toId = typeof toAccountId === 'string' ? parseInt(toAccountId) : toAccountId;
    const amountValue = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (!fromId || !toId || !amountValue || isNaN(fromId) || isNaN(toId) || isNaN(amountValue)) {
      return res.status(400).json({ error: 'Missing or invalid required fields: fromAccountId, toAccountId, amount' });
    }

    if (fromId === toId) {
      return res.status(400).json({ error: 'Source and destination accounts cannot be the same' });
    }

    if (amountValue <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const result = await adminTransfer(
      fromId,
      toId,
      amountValue,
      description || null,
      req.user.id,
      req
    );

    res.status(201).json({ message: 'Transfer created successfully', transaction: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Get audit logs
export async function getAuditLogs(req, res) {
  try {
    const { limit = 100, offset = 0, userId, action, from, to } = req.query;
    
    let query = `SELECT al.*, u.email as user_email, u.name as user_name
                 FROM audit_logs al
                 LEFT JOIN users u ON al.user_id = u.id
                 WHERE 1=1`;
    const params = [];

    if (userId) {
      query += ' AND al.user_id = ?';
      params.push(parseInt(userId));
    }

    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }

    if (from) {
      query += ' AND al.created_at >= ?';
      params.push(from);
    }

    if (to) {
      query += ' AND al.created_at <= ?';
      params.push(to);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await pool.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM audit_logs al WHERE 1=1`;
    const countParams = [];
    if (userId) {
      countQuery += ' AND al.user_id = ?';
      countParams.push(parseInt(userId));
    }
    if (action) {
      countQuery += ' AND al.action = ?';
      countParams.push(action);
    }
    if (from) {
      countQuery += ' AND al.created_at >= ?';
      countParams.push(from);
    }
    if (to) {
      countQuery += ' AND al.created_at <= ?';
      countParams.push(to);
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].count;

    res.json({ logs, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

