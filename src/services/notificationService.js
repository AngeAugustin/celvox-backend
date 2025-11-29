import pool from '../config/database.js';

export async function createNotification(userId, type, title, body, data = {}) {
  const [result] = await pool.execute(
    'INSERT INTO notifications (user_id, type, title, body, data) VALUES (?, ?, ?, ?, ?)',
    [userId, type, title, body, JSON.stringify(data)]
  );

  return result.insertId;
}

export async function getUserNotifications(userId, filters = {}) {
  const { unreadOnly = false, limit = 50, offset = 0 } = filters;
  
  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [userId];

  if (unreadOnly) {
    query += ' AND is_read = FALSE';
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const [notifications] = await pool.execute(query, params);
  
  // Parse JSON data field for each notification
  return notifications.map(notification => ({
    ...notification,
    data: notification.data ? (typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data) : {}
  }));
}

export async function markAsRead(notificationIds, userId) {
  if (notificationIds.length === 0) return;

  const placeholders = notificationIds.map(() => '?').join(',');
  await pool.execute(
    `UPDATE notifications 
     SET is_read = TRUE 
     WHERE id IN (${placeholders}) AND user_id = ?`,
    [...notificationIds, userId]
  );
}

export async function getUnreadCount(userId) {
  const [result] = await pool.execute(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
    [userId]
  );
  return result[0].count;
}

