import exp from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { TripModel } from '../Models/TripModel.js';

export const recommendationAPI = exp.Router();

const hotels = [
  { name: 'Traveler Rest Lodge', type: 'Hotel', pricePerNight: 500, note: 'Simple stay that protects a tight budget' },
  { name: 'Smart Hostel Suites', type: 'Hotel', pricePerNight: 1600, note: 'Best value for group budgets' },
  { name: 'City Comfort Stay', type: 'Hotel', pricePerNight: 2800, note: 'Clean rooms near transit hubs' },
  { name: 'Local Boutique Inn', type: 'Hotel', pricePerNight: 4200, note: 'Central location with breakfast' },
  { name: 'Premium View Resort', type: 'Hotel', pricePerNight: 7600, note: 'Pool, lounge, and group-friendly rooms' },
];

const transport = [
  { name: 'Local Bus Day Pass', type: 'Transport', cost: 250, note: 'Best fit for very small budgets' },
  { name: 'Sleeper Train + Local Metro', type: 'Transport', cost: 4500, note: 'Lowest total cost with flexible timing' },
  { name: 'Shared Cab Package', type: 'Transport', cost: 8500, note: 'Door-to-door comfort for small groups' },
  { name: 'Round-trip Economy Flight', type: 'Transport', cost: 13500, note: 'Fastest option when dates are fixed' },
];

const activities = [
  { name: 'Self-guided Landmark Route', type: 'Activity', cost: 100, note: 'Free-form sightseeing with a small buffer' },
  { name: 'Museum and Culture Pass', type: 'Activity', cost: 1200, note: 'Low-cost indoor backup plan' },
  { name: 'Guided Heritage Walk', type: 'Activity', cost: 1800, note: 'A relaxed local introduction' },
  { name: 'Food Trail', type: 'Activity', cost: 2400, note: 'Popular group dining experience' },
  { name: 'Sunset Cruise', type: 'Activity', cost: 3200, note: 'Scenic evening activity' },
  { name: 'Adventure Day Pass', type: 'Activity', cost: 3800, note: 'High-energy full-day plan' },
];

function getTripDurationDays(trip) {
  if (!trip.startDate || !trip.endDate) return 1;
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
}

function pickHotel(availableBudget, durationDays) {
  const options = hotels
    .map((hotel) => ({ ...hotel, totalCost: hotel.pricePerNight * durationDays }))
    .filter((hotel) => hotel.totalCost <= availableBudget * 0.55)
    .sort((a, b) => b.pricePerNight - a.pricePerNight);
  return options[0] || { ...hotels[0], totalCost: hotels[0].pricePerNight * durationDays };
}

function pickTransport(remainingBudget) {
  return transport
    .filter((item) => item.cost <= remainingBudget * 0.45)
    .sort((a, b) => b.cost - a.cost)[0] || transport[0];
}

function pickActivities(remainingBudget) {
  const selected = [];
  let budget = Math.max(0, remainingBudget);

  activities
    .sort((a, b) => a.cost - b.cost)
    .forEach((activity) => {
      if (selected.length < 3 && activity.cost <= budget) {
        selected.push(activity);
        budget -= activity.cost;
      }
    });

  return selected.length ? selected : [activities[0]];
}

recommendationAPI.get('/:tripId', verifyToken, async (req, res) => {
  try {
    const trip = await TripModel.findOne({ _id: req.params.tripId, user: req.user.id }).lean({ virtuals: true });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found', errors: [] });

    const totalExpenses = (trip.expenses || []).reduce((total, expense) => total + Number(expense.amount || 0), 0);
    const durationDays = getTripDurationDays(trip);
    const availableBudget = Math.max(0, Number(trip.budget || 0) - totalExpenses);
    const hotel = pickHotel(availableBudget, durationDays);
    const selectedTransport = pickTransport(availableBudget - hotel.totalCost);
    const selectedActivities = pickActivities(availableBudget - hotel.totalCost - selectedTransport.cost);
    const activityTotal = selectedActivities.reduce((total, activity) => total + activity.cost, 0);
    const estimatedTotal = hotel.totalCost + selectedTransport.cost + activityTotal;
    const remainingBudgetPrediction = availableBudget - estimatedTotal;

    res.status(200).json({
      success: true,
      message: 'Recommendations fetched',
      data: {
        tripId: req.params.tripId,
        destination: trip.destination,
        durationDays,
        currentSpend: totalExpenses,
        availableBudget,
        allocation: {
          hotel: Math.round(availableBudget * 0.5),
          transport: Math.round(availableBudget * 0.25),
          activities: Math.round(availableBudget * 0.2),
          buffer: Math.round(availableBudget * 0.05),
        },
        hotels: [hotel],
        transport: [selectedTransport],
        activities: selectedActivities,
        estimatedTotal,
        remainingBudgetPrediction,
        alert: remainingBudgetPrediction < 0 ? 'Recommended plan exceeds remaining budget' : null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching recommendations', error: err.message, errors: [] });
  }
});

export default recommendationAPI;
