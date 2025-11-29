import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database.js';
import { jwtConfig } from '../config/jwt.js';
import { auditLog } from './auditService.js';
import { createNotification } from './notificationService.js';

export async function register(email, password, name, locale = 'fr') {
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );

  if (existing.length > 0) {
    throw new Error('Email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  
  const [result] = await pool.execute(
    'INSERT INTO users (email, password_hash, name, locale) VALUES (?, ?, ?, ?)',
    [email, passwordHash, name, locale]
  );

  const userId = result.insertId;

  // Create default current account
  await pool.execute(
    'INSERT INTO accounts (user_id, type, balance, label) VALUES (?, ?, ?, ?)',
    [userId, 'current', 0, 'Compte Principal']
  );

  await auditLog(userId, 'user_registered', { email, name }, null, null, null, null);

  return { id: userId, email, name, locale, role: 'user' };
}

export async function login(email, password, userAgent, ip, io = null) {
  const [users] = await pool.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = users[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    await auditLog(user.id, 'login_failed', { email, reason: 'invalid_password' }, ip, null, null);
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpiresIn }
  );

  const refreshToken = crypto.randomUUID();
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  // Store session
  await pool.execute(
    `INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip, expires_at) 
     VALUES (?, ?, ?, ?, ?)`,
    [user.id, refreshTokenHash, userAgent, ip, expiresAt]
  );

  await auditLog(user.id, 'login_success', { email }, ip, null, null);

  // Check for pending transfers and create notifications
  try {
    const [pendingTransfers] = await pool.execute(
      `SELECT t.id, t.amount, t.description, t.created_at, 
              a.user_id as sender_user_id, u.name as sender_name, u.email as sender_email
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       JOIN users u ON a.user_id = u.id
       WHERE t.status = 'pending'
       AND t.type = 'transfer'
       AND t.counterparty_email = ?
       AND t.related_account_id IS NULL`,
      [user.email]
    );

    if (pendingTransfers.length > 0) {
      // Create a notification for each pending transfer
      for (const transfer of pendingTransfers) {
        const formattedAmount = new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(transfer.amount);

        await createNotification(
          user.id,
          'pending_transfer',
          'Virement en attente',
          `Vous avez reçu un virement de ${formattedAmount} de ${transfer.sender_name || transfer.sender_email}. Acceptez-le pour créditer votre compte.`,
          {
            transactionId: transfer.id,
            amount: transfer.amount,
            description: transfer.description,
            senderName: transfer.sender_name,
            senderEmail: transfer.sender_email,
            createdAt: transfer.created_at
          }
        );
      }
    }
  } catch (error) {
    // Don't fail login if notification creation fails
    console.error('Error creating pending transfer notifications:', error);
  }

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      locale: user.locale,
      role: user.role
    }
  };
}

export async function refreshAccessToken(refreshToken) {
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const [sessions] = await pool.execute(
    `SELECT s.*, u.id as user_id, u.email, u.role 
     FROM sessions s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.refresh_token_hash = ? 
     AND s.revoked_at IS NULL 
     AND s.expires_at > NOW()`,
    [refreshTokenHash]
  );

  if (sessions.length === 0) {
    throw new Error('Invalid refresh token');
  }

  const session = sessions[0];

  // Generate new access token
  const accessToken = jwt.sign(
    { id: session.user_id, email: session.email, role: session.role },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpiresIn }
  );

  return { accessToken };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;

  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  await pool.execute(
    'UPDATE sessions SET revoked_at = NOW() WHERE refresh_token_hash = ?',
    [refreshTokenHash]
  );
}

