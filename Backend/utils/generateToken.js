import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    { user: { id: user._id.toString(), role: user.role } },
    env.jwtSecret,
    { expiresIn: env.accessTokenTtl },
  );
}

export function signRefreshToken(user, sessionId) {
  return jwt.sign(
    { user: { id: user._id.toString(), role: user.role }, sessionId },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenTtl },
  );
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
