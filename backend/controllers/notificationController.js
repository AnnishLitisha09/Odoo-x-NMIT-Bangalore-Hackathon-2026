const { Notification } = require('../models');

async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const count = await Notification.count({
      where: { userId, isRead: false },
    });
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({ message: 'Marked as read.', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );
    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function deleteNotification(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    await notification.destroy();
    return res.status(200).json({ message: 'Notification deleted.' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
