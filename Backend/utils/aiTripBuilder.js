import { ActivityModel } from '../Models/ActivityModel.js';
import { ExpenseModel } from '../Models/ExpenseModel.js';
import { TripModel } from '../Models/TripModel.js';

function startOfDay(date = new Date()) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function parseInrAmount(value) {
  if (typeof value === 'number' && !Number.isNaN(value)) return Math.max(0, value);
  const match = String(value || '').replace(/,/g, '').match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function normalizeInterests(interests) {
  if (Array.isArray(interests)) return interests.map((item) => String(item).trim()).filter(Boolean);
  if (typeof interests === 'string') return interests.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function buildTripDates(days) {
  const startDate = startOfDay(new Date());
  const endDate = addDays(startDate, Math.max(Number(days) || 1, 1) - 1);
  return { startDate, endDate };
}

function buildActivityNotes(activity) {
  const parts = [activity.description, activity.estimatedCost ? `Est. cost: ${activity.estimatedCost}` : '']
    .map((part) => String(part || '').trim())
    .filter(Boolean);
  return parts.join(' · ');
}

export async function buildItineraryFromAiPlan(aiPlan, tripId, userId, startDate) {
  const itinerary = [];
  const days = Array.isArray(aiPlan?.days) ? aiPlan.days : [];

  for (let index = 0; index < days.length; index += 1) {
    const day = days[index];
    const dayDate = addDays(startDate, index);
    const dayActivities = [];

    for (const activity of day.activities || []) {
      const activityName = String(activity.name || activity.activity || 'Planned activity').trim();
      const activityTime = String(activity.time || '09:00').trim() || '09:00';
      const notes = buildActivityNotes(activity);

      const savedActivity = await ActivityModel.create({
        trip: tripId,
        user: userId,
        date: dayDate,
        time: activityTime,
        activity: activityName,
        notes,
        completed: false,
      });

      dayActivities.push({
        _id: savedActivity._id,
        time: activityTime,
        activity: activityName,
        notes,
        completed: false,
      });
    }

    itinerary.push({
      date: dayDate,
      activities: dayActivities,
    });
  }

  return itinerary;
}

export function buildEstimatedExpenses(estimatedBudget) {
  const budget = estimatedBudget || {};
  const entries = [
    { description: 'Estimated hotel budget (AI)', amount: parseInrAmount(budget.hotel), category: 'Accommodation' },
    { description: 'Estimated food budget (AI)', amount: parseInrAmount(budget.food), category: 'Food' },
    { description: 'Estimated transport budget (AI)', amount: parseInrAmount(budget.transport), category: 'Transport' },
    { description: 'Estimated activities budget (AI)', amount: parseInrAmount(budget.activities), category: 'Activities' },
  ];

  return entries.filter((entry) => entry.amount > 0);
}

export async function saveAiTripForUser({
  userId,
  destination,
  budget,
  days,
  travelers,
  interests,
  aiPlan,
}) {
  const tripDestination = String(destination || '').trim();
  const tripBudget = Number(budget || 0);
  const tripDays = Number(days || 0);
  const tripTravelers = Number(travelers || 0);
  const normalizedInterests = normalizeInterests(interests);

  if (!tripDestination || tripBudget <= 0 || tripDays <= 0 || tripTravelers <= 0) {
    throw new Error('destination, positive budget, positive days, and positive travelers are required');
  }

  if (!aiPlan || !Array.isArray(aiPlan.days)) {
    throw new Error('A valid AI plan is required');
  }

  const { startDate, endDate } = buildTripDates(tripDays);
  const trip = await TripModel.create({
    title: `${tripDestination} AI Trip`,
    destination: tripDestination,
    startDate,
    endDate,
    budget: tripBudget,
    status: 'Planning',
    aiGenerated: true,
    aiSummary: String(aiPlan.summary || '').trim(),
    interests: normalizedInterests,
    travelers: tripTravelers,
    aiRecommendations: {
      hotels: Array.isArray(aiPlan.hotels) ? aiPlan.hotels : [],
      food: Array.isArray(aiPlan.food) ? aiPlan.food : [],
      transport: Array.isArray(aiPlan.transport) ? aiPlan.transport : [],
      tips: Array.isArray(aiPlan.tips) ? aiPlan.tips : [],
    },
    user: userId,
    itinerary: [],
    expenses: [],
  });

  const itinerary = await buildItineraryFromAiPlan(aiPlan, trip._id, userId, startDate);
  trip.itinerary = itinerary;

  const estimatedExpenses = buildEstimatedExpenses(aiPlan.estimatedBudget);
  const embeddedExpenses = [];

  for (const expense of estimatedExpenses) {
    const savedExpense = await ExpenseModel.create({
      trip: trip._id,
      user: userId,
      description: expense.description,
      amount: expense.amount,
      date: startDate,
      category: expense.category,
    });

    embeddedExpenses.push({
      _id: savedExpense._id,
      description: expense.description,
      amount: expense.amount,
      date: startDate,
      category: expense.category,
    });
  }

  trip.expenses = embeddedExpenses;
  await trip.save();

  return trip.toObject({ virtuals: true });
}
