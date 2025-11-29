import {
  getUserNotifications,
  markAsRead,
  getUnreadCount
} from '../services/notificationService.js';

export async function getNotifications(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = {
      unreadOnly: req.query.unreadOnly === 'true' || req.query.unreadOnly === true,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const notifications = await getUserNotifications(req.user.id, filters);
    const unreadCount = await getUnreadCount(req.user.id);

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function markAsReadHandler(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array required' });
    }

    await markAsRead(ids, req.user.id);
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

