const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Notification = require('../models/Notification');
const {
  addNotification,
  getNotificationsForUser,
  markNotificationAsRead,
} = require('../services/demoStore');

const resolveSessionUserId = (req) => req.user?.userId || req.user?.id || '';

const isDemoSession = (req) => {
  const sessionUserId = resolveSessionUserId(req);
  return !sessionUserId || !mongoose.Types.ObjectId.isValid(sessionUserId);
};

exports.createNotification = async ({ user, title, message, type = 'info', relatedTransaction = null }) => {
  const normalizedRelatedTransaction = mongoose.Types.ObjectId.isValid(String(relatedTransaction || ''))
    ? relatedTransaction
    : null;

  if (!connectDB.isConnected() || !mongoose.Types.ObjectId.isValid(String(user || ''))) {
    return addNotification({
      user,
      title,
      message,
      type,
      relatedTransaction: normalizedRelatedTransaction,
    });
  }

  return Notification.create({
    user: String(user || ''),
    title,
    message,
    type,
    relatedTransaction: normalizedRelatedTransaction,
  });
};

exports.getMyNotifications = async (req, res) => {
  try {
    if (!connectDB.isConnected() || isDemoSession(req)) {
      const notifications = getNotificationsForUser(resolveSessionUserId(req)).slice(0, 25);
      return res.status(200).json({
        success: true,
        notifications,
      });
    }

    const notifications = await Notification.find({ user: resolveSessionUserId(req) })
      .sort({ createdAt: -1 })
      .limit(25);

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    if (!connectDB.isConnected() || isDemoSession(req)) {
      const notification = markNotificationAsRead(req.params.id, resolveSessionUserId(req));
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      return res.status(200).json({ success: true, notification });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: resolveSessionUserId(req) },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error('Notification update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};
