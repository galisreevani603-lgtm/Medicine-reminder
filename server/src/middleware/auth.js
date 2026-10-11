import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ success: false, message: 'Access token required' });
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(payload.sub);
    if (!req.user) return res.status(401).json({ success: false, message: 'Account no longer exists' });
    next();
  } catch { res.status(401).json({ success: false, message: 'Invalid or expired access token' }); }
}
export const authorize = (...roles) => (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ success: false, message: 'You do not have access to this resource' });
