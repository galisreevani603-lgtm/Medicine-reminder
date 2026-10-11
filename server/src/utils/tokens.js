import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

export const signAccess = (user) => jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' });
export const signRefresh = () => crypto.randomBytes(48).toString('hex');
export function publicUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role, approved: user.approved, preferences: user.preferences }; }
