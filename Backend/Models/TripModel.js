import mongoose from 'mongoose';
import { tripStatuses } from '../utils/tripStatus.js';

const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  category: { type: String, default: 'Other', trim: true },
  paidBy: { type: String, trim: true },
  splitBetween: [{ type: String, trim: true }],
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
  time: { type: String, required: true },
  activity: { type: String, required: true, trim: true },
  notes: { type: String, trim: true },
  completed: { type: Boolean, default: false },
  reminderAt: Date,
}, { timestamps: true });

const dayItinerarySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  activities: [activitySchema],
});

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['Leader', 'Member'],
    default: 'Member',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const packingItemSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  packed: {
    type: Boolean,
    default: false,
  },
});

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  destination: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  startDate: {
    type: Date,
    required: true,
    index: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  budget: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: tripStatuses,
    default: 'Planning',
    index: true,
  },
  itinerary: [dayItinerarySchema],
  expenses: [expenseSchema],
  members: [memberSchema],
  packingChecklist: [packingItemSchema],
  coverImage: {
    type: String,
    trim: true,
    default: '',
  },
  aiGenerated: {
    type: Boolean,
    default: false,
    index: true,
  },
  aiSummary: {
    type: String,
    trim: true,
    default: '',
  },
  interests: [{
    type: String,
    trim: true,
  }],
  travelers: {
    type: Number,
    min: 1,
    default: 1,
  },
  aiRecommendations: {
    hotels: { type: Array, default: [] },
    food: { type: Array, default: [] },
    transport: { type: Array, default: [] },
    tips: { type: Array, default: [] },
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

tripSchema.index({ title: 'text', destination: 'text' });
tripSchema.index({ user: 1, status: 1, startDate: 1 });

tripSchema.virtual('totalExpenses').get(function getTotalExpenses() {
  return (this.expenses || []).reduce((total, expense) => total + Number(expense.amount || 0), 0);
});

tripSchema.virtual('remainingBudget').get(function getRemainingBudget() {
  return Math.max(0, Number(this.budget || 0) - this.totalExpenses);
});

tripSchema.virtual('budgetUtilization').get(function getBudgetUtilization() {
  return this.budget > 0 ? Math.round((this.totalExpenses / this.budget) * 100) : 0;
});

tripSchema.pre('save', function updateStatus(next) {
  const now = new Date();
  if (!this.isModified('status') || this.status === 'Planning') {
    if (this.endDate && this.endDate < now) this.status = 'Completed';
    else if (this.startDate && this.startDate <= now && this.endDate >= now) this.status = 'Ongoing';
    else if (this.startDate && this.startDate > now && this.status === 'Planning') this.status = 'Upcoming';
  }
  next();
});

export const TripModel = mongoose.model('Trip', tripSchema);
