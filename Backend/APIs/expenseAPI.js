import exp from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { ExpenseModel } from '../Models/ExpenseModel.js';
import { NotificationModel } from '../Models/NotificationModel.js';
import { TripModel } from '../Models/TripModel.js';

export const expenseAPI = exp.Router();

function buildSplits(amount, members = [], splitBetween = []) {
  if (splitBetween.length && typeof splitBetween[0] === 'object') return splitBetween;
  const selectedMembers = splitBetween.length ? splitBetween : members.map((member) => member.name);
  if (!selectedMembers.length) return [];
  const perMember = Number((Number(amount) / selectedMembers.length).toFixed(2));
  return selectedMembers.map((memberName) => ({ memberName, amount: perMember }));
}

function getTotalExpenses(expenses = []) {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function validateExpenseWithinBudget(trip, amount) {
  const budget = Number(trip.budget || 0);
  if (!budget) return null;

  const currentTotal = getTotalExpenses(trip.expenses || []);
  const nextTotal = currentTotal + Number(amount || 0);
  if (nextTotal <= budget) return null;

  return {
    remainingBudget: Math.max(0, budget - currentTotal),
    budget,
    nextTotal,
  };
}

function validateExpenseUpdateWithinBudget(trip, expenseId, nextAmount) {
  const budget = Number(trip.budget || 0);
  if (!budget) return null;

  const totalWithoutExpense = (trip.expenses || []).reduce((sum, expense) => (
    String(expense._id) === String(expenseId) ? sum : sum + Number(expense.amount || 0)
  ), 0);
  const nextTotal = totalWithoutExpense + Number(nextAmount || 0);
  if (nextTotal <= budget) return null;

  return {
    remainingBudget: Math.max(0, budget - totalWithoutExpense),
    budget,
    nextTotal,
  };
}

async function createBudgetAlert(trip, userId) {
  const totalExpenses = getTotalExpenses(trip.expenses || []);
  const budget = Number(trip.budget || 0);
  if (!budget || totalExpenses < budget * 0.8) return;

  await NotificationModel.create({
    user: userId,
    trip: trip._id,
    type: 'budget_alert',
    title: totalExpenses > budget ? 'Budget exceeded' : '80% Budget Used',
    message: `${trip.title} has used ${Math.round((totalExpenses / budget) * 100)}% of its budget.`,
  });
}

expenseAPI.post('/', verifyToken, async (req, res) => {
  try {
    const { tripId, description, amount, category = 'Other', date, paidBy, splitBetween = [] } = req.body;
    if (!tripId || !description || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: ['tripId, description, and positive amount are required'] });
    }

    const trip = await TripModel.findOne({ _id: tripId, user: req.user.id });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found', errors: [] });

    const budgetError = validateExpenseWithinBudget(trip, amount);
    if (budgetError) {
      return res.status(400).json({
        success: false,
        message: 'Expense exceeds trip budget',
        errors: [`Only INR ${budgetError.remainingBudget.toLocaleString('en-IN')} is remaining in this trip budget`],
      });
    }

    const splits = buildSplits(amount, trip.members, splitBetween);
    const expense = await ExpenseModel.create({
      trip: trip._id,
      user: req.user.id,
      description,
      amount,
      date: date || new Date(),
      category,
      paidBy,
      splitBetween: splits,
    });

    trip.expenses.push({
      _id: expense._id,
      description,
      amount,
      date: expense.date,
      category,
      paidBy,
      splitBetween: splits.map((split) => split.memberName),
    });
    await trip.save();
    await createBudgetAlert(trip, req.user.id);

    res.status(201).json({ success: true, message: 'Expense created', data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating expense', error: err.message, errors: [] });
  }
});

expenseAPI.put('/:id', verifyToken, async (req, res) => {
  try {
    let expense = await ExpenseModel.findOne({ _id: req.params.id, user: req.user.id });
    let trip;

    if (expense) {
      trip = await TripModel.findOne({ _id: expense.trip, user: req.user.id });
      const nextAmount = req.body.amount ?? expense.amount;
      const budgetError = validateExpenseUpdateWithinBudget(trip, req.params.id, nextAmount);
      if (budgetError) {
        return res.status(400).json({
          success: false,
          message: 'Expense exceeds trip budget',
          errors: [`Only INR ${budgetError.remainingBudget.toLocaleString('en-IN')} is remaining in this trip budget`],
        });
      }
      Object.assign(expense, req.body);
      if (req.body.splitBetween) expense.splitBetween = buildSplits(expense.amount, trip.members, req.body.splitBetween);
      await expense.save();
    } else {
      trip = await TripModel.findOne({ user: req.user.id, 'expenses._id': req.params.id });
      if (!trip) return res.status(404).json({ success: false, message: 'Expense not found', errors: [] });
    }

    const embedded = trip.expenses.id(req.params.id);
    if (embedded) {
      const nextAmount = req.body.amount ?? embedded.amount;
      const budgetError = validateExpenseUpdateWithinBudget(trip, req.params.id, nextAmount);
      if (budgetError) {
        return res.status(400).json({
          success: false,
          message: 'Expense exceeds trip budget',
          errors: [`Only INR ${budgetError.remainingBudget.toLocaleString('en-IN')} is remaining in this trip budget`],
        });
      }
      Object.assign(embedded, {
        description: req.body.description ?? embedded.description,
        amount: req.body.amount ?? embedded.amount,
        category: req.body.category ?? embedded.category,
        date: req.body.date ?? embedded.date,
        paidBy: req.body.paidBy ?? embedded.paidBy,
      });
      await trip.save();
    }

    res.status(200).json({ success: true, message: 'Expense updated', data: expense || embedded });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating expense', error: err.message, errors: [] });
  }
});

expenseAPI.delete('/:id', verifyToken, async (req, res) => {
  try {
    const expense = await ExpenseModel.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    const tripFilter = expense ? { _id: expense.trip, user: req.user.id } : { user: req.user.id, 'expenses._id': req.params.id };
    const trip = await TripModel.findOne(tripFilter);

    if (!trip) return res.status(404).json({ success: false, message: 'Expense not found', errors: [] });

    trip.expenses.pull(req.params.id);
    await trip.save();
    res.status(200).json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting expense', error: err.message, errors: [] });
  }
});

expenseAPI.get('/analytics/:tripId', verifyToken, async (req, res) => {
  try {
    const trip = await TripModel.findOne({ _id: req.params.tripId, user: req.user.id });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found', errors: [] });

    const categoryBreakdown = {};
    const memberSplits = {};
    const expenses = trip.expenses || [];

    expenses.forEach((expense) => {
      const amount = Number(expense.amount || 0);
      categoryBreakdown[expense.category || 'Other'] = (categoryBreakdown[expense.category || 'Other'] || 0) + amount;
      const splitMembers = expense.splitBetween?.length ? expense.splitBetween : trip.members.map((member) => member.name);
      const share = splitMembers.length ? amount / splitMembers.length : 0;
      splitMembers.forEach((member) => {
        const name = typeof member === 'string' ? member : member.memberName;
        memberSplits[name] = (memberSplits[name] || 0) + share;
      });
    });

    res.status(200).json({
      success: true,
      message: 'Expense analytics fetched',
      data: {
        tripId: req.params.tripId,
        categoryBreakdown,
        memberSplits,
        highestExpense: [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0] || null,
        expenseCount: expenses.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching expense analytics', error: err.message, errors: [] });
  }
});

expenseAPI.get('/summary/:tripId', verifyToken, async (req, res) => {
  try {
    const trip = await TripModel.findOne({ _id: req.params.tripId, user: req.user.id });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found', errors: [] });

    const monthly = {};
    const total = (trip.expenses || []).reduce((sum, expense) => {
      const key = new Date(expense.date).toISOString().slice(0, 7);
      monthly[key] = (monthly[key] || 0) + Number(expense.amount || 0);
      return sum + Number(expense.amount || 0);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Expense summary fetched',
      data: {
        tripId: req.params.tripId,
        total,
        budget: trip.budget,
        remainingBudget: Math.max(0, Number(trip.budget || 0) - total),
        budgetUtilization: trip.budget > 0 ? Math.round((total / trip.budget) * 100) : 0,
        monthly,
        alert: trip.budget > 0 && total >= trip.budget * 0.8,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching expense summary', error: err.message, errors: [] });
  }
});

export default expenseAPI;
