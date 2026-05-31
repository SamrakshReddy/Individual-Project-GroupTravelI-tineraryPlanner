import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  time: {
    type: String,
    required: true,
  },
  activity: {
    type: String,
    required: true,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
    index: true,
  },
  reminderAt: Date,
}, { timestamps: true });

activitySchema.index({ user: 1, date: 1, time: 1 });

export const ActivityModel = mongoose.model('Activity', activitySchema);
