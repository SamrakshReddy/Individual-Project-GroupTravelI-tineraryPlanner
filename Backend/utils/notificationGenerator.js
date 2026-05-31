import { TripModel } from '../Models/TripModel.js';
import { NotificationModel } from '../Models/NotificationModel.js';

function startOfDay(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

async function notificationExists(filter) {
  const existing = await NotificationModel.findOne(filter).select('_id').lean();
  return Boolean(existing);
}

async function createNotificationIfNew(payload, duplicateFilter) {
  if (await notificationExists(duplicateFilter)) return null;
  return NotificationModel.create(payload);
}

export function formatNotification(notification) {
  const doc = notification.toObject ? notification.toObject() : notification;
  return {
    ...doc,
    userId: doc.user,
    isRead: doc.read,
  };
}

export async function syncUserNotifications(userId) {
  const trips = await TripModel.find({ user: userId }).lean();
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const trip of trips) {
    const totalExpenses = (trip.expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const budget = Number(trip.budget || 0);
    const tripStart = startOfDay(trip.startDate);

    if (budget > 0 && totalExpenses >= budget * 0.8) {
      const exceeded = totalExpenses > budget;
      await createNotificationIfNew(
        {
          user: userId,
          trip: trip._id,
          type: exceeded ? 'expense_alert' : 'budget_alert',
          title: exceeded ? 'Budget exceeded' : '80% budget used',
          message: `${trip.title} has used ${Math.round((totalExpenses / budget) * 100)}% of its budget.`,
          read: false,
        },
        {
          user: userId,
          trip: trip._id,
          type: exceeded ? 'expense_alert' : 'budget_alert',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      );
    }

    if (tripStart.getTime() === tomorrow.getTime()) {
      await createNotificationIfNew(
        {
          user: userId,
          trip: trip._id,
          type: 'trip_reminder',
          title: 'Trip starts tomorrow',
          message: `${trip.title} to ${trip.destination} begins tomorrow.`,
          read: false,
        },
        {
          user: userId,
          trip: trip._id,
          type: 'trip_reminder',
          title: 'Trip starts tomorrow',
        },
      );
    }

    for (const day of trip.itinerary || []) {
      const activityDate = startOfDay(day.date);
      const dayDiff = Math.round((activityDate - today) / (1000 * 60 * 60 * 24));

      if (dayDiff < 0 || dayDiff > 1) continue;

      for (const activity of day.activities || []) {
        await createNotificationIfNew(
          {
            user: userId,
            trip: trip._id,
            type: 'activity_reminder',
            title: 'Upcoming activity',
            message: `${activity.activity} is scheduled for ${activityDate.toDateString()}${activity.time ? ` at ${activity.time}` : ''}.`,
            read: false,
          },
          {
            user: userId,
            trip: trip._id,
            type: 'activity_reminder',
            message: { $regex: activity.activity },
            createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
          },
        );
      }
    }
  }
}
