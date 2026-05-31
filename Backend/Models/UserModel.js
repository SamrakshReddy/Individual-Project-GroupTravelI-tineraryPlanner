import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const roles = {
  ADMIN: 'admin',
  USER: 'user',
};

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: Object.values(roles),
    default: roles.USER,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.virtual('displayName').get(function getDisplayName() {
  return this.username || this.email;
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    _id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
  };
};

export const UserModel = mongoose.model('User', userSchema);
