import { validationResult } from 'express-validator';
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Please correct the highlighted fields', errors: errors.array() });
  next();
}
