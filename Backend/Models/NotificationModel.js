import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
  },
  type: {
    type: String,
    enum: [
      'budget_alert',
      'activity_reminder',
      'trip_reminder',
      'trip_status',
      'expense_alert',
      'ai_reminder',
      'system',
    ],
    default: 'system',
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { timestamps: true });

export const NotificationModel = mongoose.model('Notification', notificationSchema);
