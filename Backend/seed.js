import dotenv from 'dotenv';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { TripModel } from './Models/TripModel.js';
import { UserModel } from './Models/UserModel.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-planner';
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-access-secret';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for seeding');

    let user = await UserModel.findOne({ email: 'demo@demo.com' });
    if (!user) {
      user = await UserModel.create({ username: 'demo', email: 'demo@demo.com', password: 'password' });
      console.log('Created demo user: demo@demo.com / password');
    } else {
      console.log('Demo user already exists');
    }

    await TripModel.deleteOne({ title: 'Tirupati', user: user._id });
    await TripModel.create({
      title: 'Tirupati',
      destination: 'Tirupati',
      startDate: new Date('2026-07-19'),
      endDate: new Date('2026-07-21'),
      budget: 1000,
      itinerary: [
        {
          date: new Date('2026-07-19'),
          activities: [
            { time: '14:30', activity: 'Arrival at Tirupati', notes: 'Check-in at hotel' },
            { time: '18:00', activity: 'Explore local market', notes: 'Evening walk' },
          ],
        },
        {
          date: new Date('2026-07-20'),
          activities: [
            { time: '06:00', activity: 'Early morning temple visit', notes: 'Sri Venkateswara Temple - main darshan' },
            { time: '12:00', activity: 'Lunch at temple canteen', notes: 'Traditional South Indian meal' },
            { time: '16:00', activity: 'Visit Alipiri temple', notes: 'Hill temple with scenic views' },
          ],
        },
      ],
      expenses: [
        { description: 'Train ticket', amount: 250, category: 'Transport', date: new Date('2026-07-19') },
        { description: 'Hotel check-in', amount: 200, category: 'Other', date: new Date('2026-07-19') },
        { description: 'Dinner on arrival', amount: 35, category: 'Food', date: new Date('2026-07-19') },
      ],
      user: user._id,
    });

    const token = jwt.sign({ user: { id: user.id, role: user.role } }, JWT_SECRET, { expiresIn: '7d' });
    fs.writeFileSync('seed-token.txt', token);
    console.log('SEED COMPLETE');
    console.log('Token saved to seed-token.txt');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error', err);
    process.exit(1);
  }
}

seed();
