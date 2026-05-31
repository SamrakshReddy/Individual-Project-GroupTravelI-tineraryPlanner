import mongoose from 'mongoose';
import { expenseCategories } from '../utils/expenseCategories.js';

const expenseSplitSchema = new mongoose.Schema({
  memberName: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  settled: { type: Boolean, default: false },
});

const expenseSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
  category: {
    type: String,
    enum: expenseCategories,
    default: 'Other',
    index: true,
  },
  paidBy: {
    type: String,
    trim: true,
  },
  splitBetween: [expenseSplitSchema],
}, { timestamps: true });

expenseSchema.index({ trip: 1, category: 1, date: -1 });

export const ExpenseModel = mongoose.model('Expense', expenseSchema);
