import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { sendPasswordResetEmail } from './emailService.js';

/**
 * Generate a random 6-character alphanumeric code
 */
function generateResetCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Request password reset - generates and sends code to user's email
 */
export async function requestPasswordReset(email) {
  // Find user by email
  const [users] = await pool.execute(
    'SELECT id, email, name FROM users WHERE email = ?',
    [email]
  );

  // Don't reveal if email exists (security best practice)
  if (users.length === 0) {
    // Still return success to prevent email enumeration
    return { success: true, message: 'If the email exists, a reset code has been sent.' };
  }

  const user = users[0];

  // Invalidate any existing unused codes for this user
  await pool.execute(
    'UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
    [user.id]
  );

  // Generate 6-character alphanumeric code
  const code = generateResetCode();

  // Set expiration to 15 minutes from now
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  // Store reset code
  await pool.execute(
    'INSERT INTO password_resets (user_id, code, expires_at) VALUES (?, ?, ?)',
    [user.id, code, expiresAt]
  );

  // Send email with code
  await sendPasswordResetEmail(user.email, user.name, code);

  return { success: true, message: 'If the email exists, a reset code has been sent.' };
}

/**
 * Verify reset code and reset password
 */
export async function resetPassword(email, code, newPassword) {
  // Validate password
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  // Find user
  const [users] = await pool.execute(
    'SELECT id, email FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    throw new Error('Invalid email or code');
  }

  const user = users[0];

  // Find valid reset code
  const [resets] = await pool.execute(
    `SELECT id, code, expires_at, used_at 
     FROM password_resets 
     WHERE user_id = ? AND code = ? AND used_at IS NULL
     ORDER BY created_at DESC 
     LIMIT 1`,
    [user.id, code.toUpperCase()]
  );

  if (resets.length === 0) {
    throw new Error('Invalid or expired reset code');
  }

  const reset = resets[0];

  // Check if code is expired
  if (new Date(reset.expires_at) < new Date()) {
    throw new Error('Reset code has expired. Please request a new one.');
  }

  // Check if code is already used
  if (reset.used_at) {
    throw new Error('This reset code has already been used');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update user password
  await pool.execute(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [passwordHash, user.id]
  );

  // Mark reset code as used
  await pool.execute(
    'UPDATE password_resets SET used_at = NOW() WHERE id = ?',
    [reset.id]
  );

  // Revoke all user sessions (force re-login)
  await pool.execute(
    'UPDATE sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
    [user.id]
  );

  return { success: true, message: 'Password reset successfully' };
}

