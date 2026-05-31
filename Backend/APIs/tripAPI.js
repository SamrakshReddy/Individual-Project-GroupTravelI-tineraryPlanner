import exp from 'express';
import env from '../config/env.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  cloudinary,
  configureCloudinary,
  createTripCoverUploader,
  extractCloudinaryPublicIdFromUrl,
  isCloudinaryConfigured,
} from '../config/cloudinary.js';
import { uploadTripImage } from '../middlewares/uploadImage.js';
import {
  buildPublicImageUrl,
  deleteLocalCoverImageIfExists,
  saveCoverImageLocally,
} from '../utils/localImageStorage.js';
import { TripModel } from '../Models/TripModel.js';
import { ExpenseModel } from '../Models/ExpenseModel.js';
import { ActivityModel } from '../Models/ActivityModel.js';
import { NotificationModel } from '../Models/NotificationModel.js';
import { buildTripQuery, getPagination, getSort } from '../utils/queryBuilder.js';

export const tripAPI = exp.Router();

async function deleteCloudinaryCoverIfPossible(url) {
  if (!isCloudinaryConfigured()) return;
  const publicId = extractCloudinaryPublicIdFromUrl(url);
  if (!publicId) return;
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

function hasAdvancedQuery(query) {
  return ['search', 'status', 'sort', 'page', 'limit'].some((key) => query[key] !== undefined);
}

function validateTripPayload(payload, isUpdate = false) {
  const errors = [];
  if (!isUpdate && !payload.title) errors.push({ field: 'title', message: 'Trip title is required' });
  if (!isUpdate && !payload.destination) errors.push({ field: 'destination', message: 'Destination is required' });
  if (!isUpdate && !payload.startDate) errors.push({ field: 'startDate', message: 'Start date is required' });
  if (!isUpdate && !payload.endDate) errors.push({ field: 'endDate', message: 'End date is required' });
  if (payload.budget !== undefined && Number(payload.budget) < 0) errors.push({ field: 'budget', message: 'Budget must be zero or greater' });
  if (payload.startDate && payload.endDate && new Date(payload.endDate) < new Date(payload.startDate)) {
    errors.push({ field: 'endDate', message: 'End date must be after start date' });
  }
  return errors;
}

function sameDay(left, right) {
  return new Date(left).toDateString() === new Date(right).toDateString();
}

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

async function findUserTrip(tripId, userId) {
  return TripModel.findOne({ _id: tripId, user: userId });
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

tripAPI.get('/', verifyToken, async (req, res) => {
  try {
    const filter = buildTripQuery(req.query, req.user.id);
    const { page, limit, skip } = getPagination(req.query);
    const sort = getSort(req.query.sort);

    const [trips, total] = await Promise.all([
      TripModel.find(filter)
        .populate('user', 'username email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      TripModel.countDocuments(filter),
    ]);

    if (!hasAdvancedQuery(req.query)) return res.status(200).json(trips);

    res.status(200).json({
      success: true,
      message: 'Trips fetched',
      data: trips,
      meta: { page, limit, total, pages: Math.ceil(total / limit) || 1, sort },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching trips', error: err.message, errors: [] });
  }
});

tripAPI.post('/upload-image/:tripId', verifyToken, (req, res, next) => {
  uploadTripImage.single('image')(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid image upload',
        errors: [],
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['An image file is required'],
      });
    }

    const trip = await findUserTrip(req.params.tripId, req.user.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found', errors: [] });
    }

    const baseUrl = env.publicBaseUrl || `${req.protocol}://${req.get('host')}`;
    let coverImageUrl = '';

    if (isCloudinaryConfigured()) {
      configureCloudinary();

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'travel-planner/trips',
            resource_type: 'image',
            transformation: [{ width: 1200, height: 800, crop: 'limit' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(req.file.buffer);
      });

      coverImageUrl = uploadResult.secure_url;
    } else {
      const relativePath = await saveCoverImageLocally(req.file, trip._id);
      coverImageUrl = buildPublicImageUrl(relativePath, baseUrl);
    }

    if (trip.coverImage) {
      await deleteLocalCoverImageIfExists(trip.coverImage, baseUrl);
      await deleteCloudinaryCoverIfPossible(trip.coverImage);
    }

    trip.coverImage = coverImageUrl;
    await trip.save();

    res.status(200).json({
      success: true,
      message: isCloudinaryConfigured() ? 'Cover image uploaded' : 'Cover image uploaded (local storage)',
      data: { coverImage: trip.coverImage },
      trip: trip.toObject({ virtuals: true }),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error uploading cover image',
      error: err.message,
      errors: [],
    });
  }
});

tripAPI.post('/upload-cover', verifyToken, (req, res, next) => {
  if (!isCloudinaryConfigured()) {
    return res.status(500).json({
      success: false,
      message: 'Cloudinary is not configured',
      errors: ['Missing Cloudinary credentials'],
    });
  }

  const uploader = createTripCoverUploader();
  uploader.single('coverImage')(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid image upload',
        errors: [],
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const imageUrl = req.file?.path || req.file?.secure_url;
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['A coverImage file is required'],
      });
    }

    res.status(200).json({
      success: true,
      imageUrl,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error uploading cover image',
      error: err.message,
      errors: [],
    });
  }
});

tripAPI.delete('/upload-image/:tripId', verifyToken, async (req, res) => {
  try {
    const trip = await findUserTrip(req.params.tripId, req.user.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found', errors: [] });
    }

    const baseUrl = env.publicBaseUrl || `${req.protocol}://${req.get('host')}`;
    await deleteLocalCoverImageIfExists(trip.coverImage, baseUrl);

    trip.coverImage = '';
    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Cover image removed',
      data: { coverImage: '' },
      trip: trip.toObject({ virtuals: true }),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error removing cover image',
      error: err.message,
      errors: [],
    });
  }
});

tripAPI.get('/:id', verifyToken, async (req, res) => {
  try {
    const trip = await TripModel.findOne({ _id: req.params.id, user: req.user.id })
      .populate('user', 'username email')
      .populate('members.user', 'username email')
      .lean({ virtuals: true });

    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found', errors: [] });
    res.status(200).json(trip);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching trip', error: err.message, errors: [] });
  }
});

tripAPI.post('/', verifyToken, async (req, res) => {
  try {
    const errors = validateTripPayload(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });

    const trip = await TripModel.create({ ...req.body, user: req.user.id });
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating trip', error: err.message, errors: [] });
  }
});

tripAPI.put('/:id', verifyToken, async (req, res) => {
  try {
    const errors = validateTripPayload(req.body, true);
    if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });

    const existingTrip = await TripModel.findOne({ _id: req.params.id, user: req.user.id });
    if (!existingTrip) return res.status(404).json({ success: false, message: 'Trip not found', errors: [] });

    if (req.body.budget !== undefined) {
      const totalExpenses = getTotalExpenses(existingTrip.expenses || []);
      if (Number(req.body.budget) < totalExpenses) {
        return res.status(400).json({
          success: false,
          message: 'Budget cannot be lower than current expenses',
          errors: [`Current expenses are INR ${totalExpenses.toLocaleString('en-IN')}`],
        });
      }
    }

    const previousCover = existingTrip.coverImage || '';
    const nextCover = req.body?.coverImage !== undefined ? String(req.body.coverImage || '') : undefined;
    const isReplacingCover = nextCover !== undefined && nextCover !== previousCover;

    const updatedTrip = await TripModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true },
    ).lean({ virtuals: true });

    if (isReplacingCover && previousCover) {
      const baseUrl = env.publicBaseUrl || `${req.protocol}://${req.get('host')}`;
      await deleteLocalCoverImageIfExists(previousCover, baseUrl);
      await deleteCloudinaryCoverIfPossible(previousCover);
    }

    res.status(200).json(updatedTrip);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating trip', error: err.message, errors: [] });
  }
});

tripAPI.delete('/:id', verifyToken, async (req, res) => {
  try {
    const trip = await TripModel.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found', errors: [] });

    await Promise.all([
      ExpenseModel.deleteMany({ trip: trip._id, user: req.user.id }),
      ActivityModel.deleteMany({ trip: trip._id, user: req.user.id }),
    ]);

    res.status(200).json({ success: true, message: 'Trip removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting trip', error: err.message, errors: [] });
  }
});

tripAPI.post('/:id/expenses', verifyToken, async (req, res) => {
  try {
    const { description, amount, category = 'Other', date, paidBy, splitBetween = [] } = req.body;
    if (!description || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: ['description and positive amount are required'] });
    }

    const trip = await findUserTrip(req.params.id, req.user.id);
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

    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error adding expense', error: err.message, errors: [] });
  }
});

tripAPI.post('/:id/activities', verifyToken, async (req, res) => {
  try {
    const { date, time, activity, notes, completed = false, reminderAt } = req.body;
    if (!date || !time || !activity) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: ['date, time, and activity are required'] });
    }

    const trip = await findUserTrip(req.params.id, req.user.id);
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

    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error adding activity', error: err.message, errors: [] });
  }
});

export default tripAPI;
