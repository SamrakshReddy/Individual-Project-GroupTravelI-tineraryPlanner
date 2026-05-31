import exp from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { UserModel } from '../Models/UserModel.js';
import { SessionModel } from '../Models/SessionModel.js';
import { hashToken, signAccessToken, signRefreshToken } from '../utils/generateToken.js';

export const authAPI = exp.Router();

function getRefreshExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
}

function safeUser(user) {
  return {
    id: user._id,
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function createSession(user, req) {
  const session = await SessionModel.create({
    user: user._id,
    refreshTokenHash: 'pending',
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
    expiresAt: getRefreshExpiry(),
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, session._id.toString());
  session.refreshTokenHash = hashToken(refreshToken);
  await session.save();

  return {
    token: accessToken,
    accessToken,
    refreshToken,
    user: safeUser(user),
  };
}

authAPI.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: ['username, email, and password are required'] });
    }

    const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists', errors: [] });
    }

    const user = await UserModel.create({ username, email, password });
    const session = await createSession(user, req);
    res.status(201).json({ success: true, message: 'Registered successfully', ...session });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error registering user', error: err.message, errors: [] });
  }
});

authAPI.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: ['email and password are required'] });
    }

    const user = await UserModel.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ success: false, message: 'Invalid credentials', errors: [] });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const session = await createSession(user, req);
    res.status(200).json({ success: true, message: 'Logged in successfully', ...session });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error logging in', error: err.message, errors: [] });
  }
});

authAPI.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token is required', errors: [] });
    }

    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    const session = await SessionModel.findOne({
      _id: decoded.sessionId,
      user: decoded.user.id,
      refreshTokenHash: hashToken(refreshToken),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({ success: false, message: 'Session is not valid', errors: [] });
    }

    const user = await UserModel.findById(decoded.user.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User session is not valid', errors: [] });
    }

    session.revokedAt = new Date();
    await session.save();

    const newSession = await createSession(user, req);
    res.status(200).json({ success: true, message: 'Token refreshed', ...newSession });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Refresh token is not valid', error: err.message, errors: [] });
  }
});

authAPI.post('/logout', verifyToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await SessionModel.findOneAndUpdate(
        { refreshTokenHash: hashToken(refreshToken), user: req.user.id },
        { revokedAt: new Date() },
      );
    } else {
      await SessionModel.updateMany({ user: req.user.id, revokedAt: null }, { revokedAt: new Date() });
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error logging out', error: err.message, errors: [] });
  }
});

authAPI.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select('-password').lean({ virtuals: true });
    res.status(200).json({ success: true, data: user, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching profile', error: err.message, errors: [] });
  }
});

export default authAPI;
