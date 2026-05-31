import exp from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { ActivityModel } from '../Models/ActivityModel.js';
import { NotificationModel } from '../Models/NotificationModel.js';
import { TripModel } from '../Models/TripModel.js';

export const activityAPI = exp.Router();

function sameDay(left, right) {
  return new Date(left).toDateString() === new Date(right).toDateString();
}

activityAPI.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const activities = await ActivityModel.find({
      user: req.user.id,
      date: { $gte: new Date() },
      completed: false,
    })
      .populate('trip', 'title destination startDate endDate')
      .sort('date time')
      .limit(20)
      .lean();

    res.status(200).json({ success: true, message: 'Upcoming activities fetched', data: activities });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching upcoming activities', error: err.message, errors: [] });
  }
});

activityAPI.post('/', verifyToken, async (req, res) => {
  try {
    const { tripId, date, time, activity, notes, completed = false, reminderAt } = req.body;
    if (!tripId || !date || !time || !activity) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: ['tripId, date, time, and activity are required'] });
    }

    const trip = await TripModel.findOne({ _id: tripId, user: req.user.id });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found', errors: [] });

    const savedActivity = await ActivityModel.create({
      trip: trip._id,
      user: req.user.id,
      date,
      time,
      activity,
      notes,
      completed,
      reminderAt,
    });

    let dayItinerary = trip.itinerary.find((day) => sameDay(day.date, date));
    if (!dayItinerary) {
      dayItinerary = { date: new Date(date), activities: [] };
      trip.itinerary.push(dayItinerary);
    }

    dayItinerary.activities.push({
      _id: savedActivity._id,
      time,
      activity,
      notes,
      completed,
      reminderAt,
    });
    await trip.save();

    if (reminderAt) {
      await NotificationModel.create({
        user: req.user.id,
        trip: trip._id,
        type: 'activity_reminder',
        title: 'Activity reminder',
        message: `${activity} is scheduled for ${new Date(date).toDateString()} at ${time}.`,
      });
    }

    res.status(201).json({ success: true, message: 'Activity created', data: savedActivity });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating activity', error: err.message, errors: [] });
  }
});

activityAPI.put('/:id', verifyToken, async (req, res) => {
  try {
    let activity = await ActivityModel.findOne({ _id: req.params.id, user: req.user.id });
    let trip;

    if (activity) {
      trip = await TripModel.findOne({ _id: activity.trip, user: req.user.id });
      Object.assign(activity, req.body);
      await activity.save();
    } else {
      trip = await TripModel.findOne({ user: req.user.id, 'itinerary.activities._id': req.params.id });
      if (!trip) return res.status(404).json({ success: false, message: 'Activity not found', errors: [] });
    }

    trip.itinerary.forEach((day) => {
      const embedded = day.activities.id(req.params.id);
      if (embedded) {
        Object.assign(embedded, {
          time: req.body.time ?? embedded.time,
          activity: req.body.activity ?? embedded.activity,
          notes: req.body.notes ?? embedded.notes,
          completed: req.body.completed ?? embedded.completed,
          reminderAt: req.body.reminderAt ?? embedded.reminderAt,
        });
        if (req.body.date) day.date = req.body.date;
      }
    });
    await trip.save();

    res.status(200).json({ success: true, message: 'Activity updated', data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating activity', error: err.message, errors: [] });
  }
});

activityAPI.delete('/:id', verifyToken, async (req, res) => {
  try {
    const activity = await ActivityModel.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    const tripFilter = activity ? { _id: activity.trip, user: req.user.id } : { user: req.user.id, 'itinerary.activities._id': req.params.id };
    const trip = await TripModel.findOne(tripFilter);

    if (!trip) return res.status(404).json({ success: false, message: 'Activity not found', errors: [] });

    trip.itinerary.forEach((day) => day.activities.pull(req.params.id));
    trip.itinerary = trip.itinerary.filter((day) => day.activities.length);
    await trip.save();

    res.status(200).json({ success: true, message: 'Activity deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting activity', error: err.message, errors: [] });
  }
});

export default activityAPI;
