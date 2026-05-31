import exp from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { TripModel } from '../Models/TripModel.js';

export const dashboardAPI = exp.Router();

function monthKey(date) {
  return new Date(date).toISOString().slice(0, 7);
}

dashboardAPI.get('/analytics', verifyToken, async (req, res) => {
  try {
    const trips = await TripModel.find({ user: req.user.id }).lean({ virtuals: true });
    const now = new Date();
    const monthlySpending = {};
    const expenseCategoryBreakdown = {};
    const destinationCounts = {};
    let totalBudget = 0;
    let totalSpending = 0;
    let upcomingTripCount = 0;

    trips.forEach((trip) => {
      totalBudget += Number(trip.budget || 0);
      if (new Date(trip.startDate) >= now || trip.status === 'Upcoming') upcomingTripCount += 1;
      destinationCounts[trip.destination] = (destinationCounts[trip.destination] || 0) + 1;

      (trip.expenses || []).forEach((expense) => {
        const amount = Number(expense.amount || 0);
        totalSpending += amount;
        monthlySpending[monthKey(expense.date)] = (monthlySpending[monthKey(expense.date)] || 0) + amount;
        expenseCategoryBreakdown[expense.category || 'Other'] = (expenseCategoryBreakdown[expense.category || 'Other'] || 0) + amount;
      });
    });

    const mostVisitedDestinations = Object.entries(destinationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([destination, count]) => ({ destination, count }));

    res.status(200).json({
      success: true,
      message: 'Dashboard analytics fetched',
      data: {
        totalTrips: trips.length,
        upcomingTripCount,
        monthlySpending,
        expenseCategoryBreakdown,
        totalBudget,
        totalSpending,
        budgetUtilizationPercent: totalBudget > 0 ? Math.round((totalSpending / totalBudget) * 100) : 0,
        mostVisitedDestinations,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard analytics', error: err.message, errors: [] });
  }
});

export default dashboardAPI;
