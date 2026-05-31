import exp from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { NotificationModel } from '../Models/NotificationModel.js';
import { formatNotification, syncUserNotifications } from '../utils/notificationGenerator.js';

export const notificationAPI = exp.Router();

notificationAPI.get('/', verifyToken, async (req, res) => {
  try {
    await syncUserNotifications(req.user.id);

    const notifications = await NotificationModel.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = notifications.filter((item) => !item.read).length;

    res.status(200).json({
      success: true,
      message: 'Notifications fetched',
      data: notifications.map(formatNotification),
      meta: { unreadCount },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: err.message,
      errors: [],
    });
  }
});

notificationAPI.post('/', verifyToken, async (req, res) => {
  try {
    const { title, message, type = 'system', tripId = null } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['title and message are required'],
      });
    }

    const allowedTypes = [
      'budget_alert',
      'activity_reminder',
      'trip_reminder',
      'trip_status',
      'expense_alert',
      'ai_reminder',
      'system',
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [`type must be one of: ${allowedTypes.join(', ')}`],
      });
    }

    const notification = await NotificationModel.create({
      user: req.user.id,
      trip: tripId || undefined,
      type,
      title: String(title).trim(),
      message: String(message).trim(),
      read: false,
    });

    res.status(201).json({
      success: true,
      message: 'Notification created',
      data: formatNotification(notification),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: err.message,
      errors: [],
    });
  }
});

notificationAPI.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true },
    ).lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        errors: [],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: formatNotification(notification),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: err.message,
      errors: [],
    });
  }
});

notificationAPI.delete('/:id', verifyToken, async (req, res) => {
  try {
    const notification = await NotificationModel.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        errors: [],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: err.message,
      errors: [],
    });
  }
});

export default notificationAPI;
