import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { signAccess, signRefresh, publicUser } from '../utils/tokens.js';

const response = (res, user, refreshToken, status = 200) => res.status(status).json({ success: true, message: 'Authenticated', data: { user: publicUser(user), accessToken: signAccess(user), refreshToken } });

export async function register(req, res, next) {
  try {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Invalid registration details', errors: errors.array() });
    const { name, email, password, role = 'PATIENT' } = req.body;
    if (role === 'ADMIN') return res.status(403).json({ success: false, message: 'Admin accounts are provisioned by the system' });
    if (await User.exists({ email })) return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    const user = await User.create({ name, email, password, role, approved: role !== 'DOCTOR' });
    if (role === 'DOCTOR') return res.status(201).json({ success: true, message: 'Doctor account created and awaiting administrator approval', data: { user: publicUser(user) } });
    const token = signRefresh(); await RefreshToken.create({ user: user.id, token, expiresAt: new Date(Date.now() + 7 * 864e5) });
    response(res, user, token, 201);
  } catch (err) { next(err); }
}
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password || ''))) return res.status(401).json({ success: false, message: 'Email or password is incorrect' });
    if (user.role === 'DOCTOR' && !user.approved) return res.status(403).json({ success: false, message: 'Doctor account is awaiting administrator approval' });
    const token = signRefresh(); await RefreshToken.create({ user: user.id, token, expiresAt: new Date(Date.now() + 7 * 864e5) });
    response(res, user, token);
  } catch (err) { next(err); }
}
export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const record = await RefreshToken.findOne({ token: refreshToken }).populate('user');
    if (!record || record.expiresAt < new Date()) return res.status(401).json({ success: false, message: 'Refresh token expired or invalid' });
    await record.deleteOne();
    const replacement = signRefresh(); await RefreshToken.create({ user: record.user.id, token: replacement, expiresAt: new Date(Date.now() + 7 * 864e5) });
    response(res, record.user, replacement);
  } catch (err) { next(err); }
}
export async function logout(req, res) {
  if (req.body.refreshToken) await RefreshToken.deleteOne({ token: req.body.refreshToken });
  res.json({ success: true, message: 'Signed out successfully', data: null });
}
export function me(req, res) { res.json({ success: true, message: 'Account loaded', data: { user: publicUser(req.user) } }); }
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.comparePassword(currentPassword || ''))) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword; await user.save(); await RefreshToken.deleteMany({ user: user.id });
    res.json({ success: true, message: 'Password changed. Sign in again on other devices.', data: null });
  } catch (err) { next(err); }
}
