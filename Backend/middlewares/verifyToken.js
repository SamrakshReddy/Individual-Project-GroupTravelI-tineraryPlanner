import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { UserModel } from '../Models/UserModel.js';

export async function verifyToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token, authorization denied', errors: [] });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await UserModel.findById(decoded.user.id).select('-password').lean();

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User session is not valid', errors: [] });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      username: user.username,
    };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token is not valid', errors: [] });
  }
}

export const protect = verifyToken;

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to access this resource', errors: [] });
    }
    next();
  };
}
