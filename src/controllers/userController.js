import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function getMe(req, res) {
  try {
    const [users] = await pool.execute(
      `SELECT id, email, name, locale, role, phone, address, city, state, zip_code, country, 
       currency, apple_pay, google_pay, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateMe(req, res) {
  try {
    const { 
      name, locale, phone, address, city, state, zip_code, country, 
      currency, apple_pay, google_pay 
    } = req.body;
    const updates = {};
    
    if (name !== undefined) updates.name = name;
    if (locale !== undefined) updates.locale = locale;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (zip_code !== undefined) updates.zip_code = zip_code;
    if (country !== undefined) updates.country = country;
    if (currency !== undefined) updates.currency = currency;
    if (apple_pay !== undefined) updates.apple_pay = apple_pay;
    if (google_pay !== undefined) updates.google_pay = google_pay;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(req.user.id);

    await pool.execute(
      `UPDATE users SET ${fields} WHERE id = ?`,
      values
    );

    const [users] = await pool.execute(
      `SELECT id, email, name, locale, role, phone, address, city, state, zip_code, country, 
       currency, apple_pay, google_pay FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Get current user with password hash
    const [users] = await pool.execute(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, req.user.id]
    );

    // Revoke all other sessions (keep current session)
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await pool.execute(
        'UPDATE sessions SET revoked_at = NOW() WHERE user_id = ? AND refresh_token_hash != ? AND revoked_at IS NULL',
        [req.user.id, refreshTokenHash]
      );
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

