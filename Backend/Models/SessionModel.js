import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  refreshTokenHash: {
    type: String,
    required: true,
    index: true,
  },
  userAgent: String,
  ipAddress: String,
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  revokedAt: Date,
}, { timestamps: true });

sessionSchema.virtual('isActive').get(function getIsActive() {
  return !this.revokedAt && this.expiresAt > new Date();
});

export const SessionModel = mongoose.model('Session', sessionSchema);
