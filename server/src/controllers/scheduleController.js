import Schedule from '../models/Schedule.js';
import DoseLog from '../models/DoseLog.js';
import User from '../models/User.js';

function patientScope(user, requested) {
  if (user.role === 'ADMIN') return requested || undefined;
  if (user.role === 'PATIENT') return user.id;
  if (user.role === 'DOCTOR') return requested;
  if (user.role === 'CAREGIVER') return user.linkedPatient?.toString();
}
export async function listSchedules(req, res, next) {
  try {
    if (req.user.role === 'CAREGIVER' && !req.user.linkedPatient) return res.json({ success: true, message: 'No linked patient', data: [], meta: { page: 1, limit: 50, total: 0, pages: 0 } });
    const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Number(req.query.limit) || 50);
    const patient = patientScope(req.user, req.query.patient);
    const filter = { ...(patient && { patient }), ...(req.query.status && { status: req.query.status }), ...(req.query.form && { form: req.query.form }), ...(req.query.search && { medicineName: { $regex: req.query.search, $options: 'i' } }) };
    if (req.user.role === 'DOCTOR' && req.query.patient) {
      const linked = await User.exists({ _id: req.query.patient, linkedDoctor: req.user.id, role: 'PATIENT' });
      if (!linked) return res.status(403).json({ success: false, message: 'Patient is not linked to this doctor' });
    }
    if (req.user.role === 'DOCTOR' && !req.query.patient) {
      const patients = await User.find({ linkedDoctor: req.user.id }).select('_id'); filter.patient = { $in: patients.map(p => p.id) };
    }
    const [data, total] = await Promise.all([Schedule.find(filter).sort({ startDate: -1 }).skip((page - 1) * limit).limit(limit).populate('prescribedBy', 'name'), Schedule.countDocuments(filter)]);
    res.json({ success: true, message: 'Schedules loaded', data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
}
export async function createSchedule(req, res, next) {
  try {
    const patient = req.user.role === 'PATIENT' ? req.user.id : req.body.patient;
    if (!patient) return res.status(400).json({ success: false, message: 'A patient is required' });
    const target = await User.findById(patient);
    if (!target || target.role !== 'PATIENT') return res.status(404).json({ success: false, message: 'Patient not found' });
    if (req.user.role === 'DOCTOR' && target.linkedDoctor?.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Link with the patient before prescribing' });
    if (req.user.role === 'ADMIN' && req.body.patient == null) return res.status(400).json({ success: false, message: 'A patient is required' });
    const schedule = await Schedule.create({ ...req.body, patient, prescribedBy: ['DOCTOR','ADMIN'].includes(req.user.role) ? req.user.id : undefined });
    res.status(201).json({ success: true, message: 'Schedule created', data: schedule });
  } catch (err) { next(err); }
}
export async function updateSchedule(req, res, next) {
  try {
    const schedule = await Schedule.findById(req.params.id); if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    if (req.user.role === 'PATIENT' && schedule.patient.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Schedule belongs to another patient' });
    if (req.user.role === 'DOCTOR' && schedule.prescribedBy?.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'You can only edit prescriptions you created' });
    if (req.user.role === 'CAREGIVER') return res.status(403).json({ success: false, message: 'Caregiver access is read-only' });
    Object.assign(schedule, req.body, { patient: schedule.patient }); await schedule.save();
    res.json({ success: true, message: 'Schedule updated', data: schedule });
  } catch (err) { next(err); }
}
export async function deleteSchedule(req, res, next) {
  try {
    const schedule = await Schedule.findById(req.params.id); if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    if (req.user.role === 'PATIENT' && schedule.patient.toString() !== req.user.id || req.user.role === 'DOCTOR' && schedule.prescribedBy?.toString() !== req.user.id || req.user.role === 'CAREGIVER') return res.status(403).json({ success: false, message: 'You cannot delete this schedule' });
    await schedule.deleteOne(); await DoseLog.deleteMany({ schedule: schedule.id });
    res.json({ success: true, message: 'Schedule and related dose history deleted', data: null });
  } catch (err) { next(err); }
}
export async function scheduleAction(req, res, next) {
  try {
    if (!['pause','resume','complete'].includes(req.body.action)) return res.status(400).json({ success: false, message: 'Action must be pause, resume or complete' });
    const schedule = await Schedule.findById(req.params.id); if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    if (req.user.role === 'PATIENT' && schedule.patient.toString() !== req.user.id || req.user.role === 'DOCTOR' && schedule.prescribedBy?.toString() !== req.user.id || req.user.role === 'CAREGIVER') return res.status(403).json({ success: false, message: 'You cannot change this schedule' });
    schedule.status = { pause: 'paused', resume: 'active', complete: 'completed' }[req.body.action]; await schedule.save();
    res.json({ success: true, message: `Schedule ${req.body.action}d`, data: schedule });
  } catch (err) { next(err); }
}
