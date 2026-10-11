import DoseLog from '../models/DoseLog.js';
import Schedule from '../models/Schedule.js';

function allowedPatient(req, requested) {
  if (req.user.role === 'PATIENT') return req.user.id;
  if (req.user.role === 'CAREGIVER') return req.user.linkedPatient?.toString();
  return requested || req.user.id;
}
export async function listDoses(req, res, next) {
  try {
    const patient = allowedPatient(req, req.query.patient);
    if (!patient) return res.json({ success: true, message: 'No linked patient', data: [] });
    if (req.user.role === 'DOCTOR' && req.query.patient) {
      const User = (await import('../models/User.js')).default;
      if (!await User.exists({ _id: patient, linkedDoctor: req.user.id, role: 'PATIENT' })) return res.status(403).json({ success: false, message: 'Patient is not linked to this doctor' });
    }
    const from = req.query.from ? new Date(req.query.from) : new Date(new Date().setHours(0,0,0,0));
    const to = req.query.to ? new Date(req.query.to) : new Date(new Date().setHours(23,59,59,999));
    const data = await DoseLog.find({ patient, scheduledTime: { $gte: from, $lte: to } }).sort({ scheduledTime: 1 }).populate('schedule');
    res.json({ success: true, message: 'Dose log loaded', data });
  } catch (err) { next(err); }
}
export async function doseAction(req, res, next) {
  try {
    const { action, note, minutes } = req.body;
    const dose = await DoseLog.findById(req.params.id).populate('schedule');
    if (!dose) return res.status(404).json({ success: false, message: 'Dose not found' });
    if (req.user.role !== 'PATIENT' || dose.patient.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Only the patient can update this dose' });
    if (!['taken','skipped','snoozed'].includes(action)) return res.status(400).json({ success: false, message: 'Action must be taken, skipped or snoozed' });
    dose.status = action; dose.note = note || ''; if (action === 'taken') { dose.takenTime = new Date(); if (dose.schedule) dose.schedule.stock = Math.max(0, dose.schedule.stock - (dose.schedule.quantityPerDose || 1)); }
    if (action === 'snoozed') dose.snoozedUntil = new Date(Date.now() + Math.min(60, Math.max(1, Number(minutes) || 10)) * 60000);
    await dose.save(); if (action === 'taken' && dose.schedule) await dose.schedule.save();
    res.json({ success: true, message: `Dose marked ${action}`, data: dose });
  } catch (err) { next(err); }
}
export async function adherence(req, res, next) {
  try {
    const patient = allowedPatient(req, req.query.patient);
    const since = new Date(Date.now() - (Number(req.query.days) || 7) * 864e5);
    const rows = await DoseLog.aggregate([{ $match: { patient: (await import('mongoose')).default.Types.ObjectId.createFromHexString(patient), scheduledTime: { $gte: since } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const counts = Object.fromEntries(rows.map(x => [x._id, x.count])); const total = Object.values(counts).reduce((a,b)=>a+b,0);
    res.json({ success: true, message: 'Adherence calculated', data: { days: Number(req.query.days) || 7, total, taken: counts.taken || 0, missed: counts.missed || 0, skipped: counts.skipped || 0, pending: counts.pending || 0, percentage: total ? Math.round((counts.taken || 0) / total * 100) : 0 } });
  } catch (err) { next(err); }
}
export async function materializeToday(req, res, next) {
  try {
    if (req.user.role !== 'PATIENT') return next();
    const start = new Date(); start.setHours(0,0,0,0); const end = new Date(start); end.setDate(end.getDate()+1);
    const schedules = await Schedule.find({ patient: req.user.id, status: 'active', startDate: { $lt: end }, $or: [{ endDate: null }, { endDate: { $gte: start } }] });
    const day = start.getDay(); const logs = [];
    for (const schedule of schedules) {
      const applies = schedule.frequency === 'daily' || schedule.frequency === 'custom' || schedule.frequency === 'alternate' && Math.floor((start - new Date(schedule.startDate).setHours(0,0,0,0)) / 864e5) % 2 === 0 || schedule.frequency === 'weekly' && day === new Date(schedule.startDate).getDay() || schedule.frequency === 'weekdays' && day > 0 && day < 6 || schedule.weekdays?.includes(day);
      if (!applies) continue;
      for (const time of schedule.times) { const [h,m] = time.split(':').map(Number); const scheduledTime = new Date(start); scheduledTime.setHours(h,m,0,0); logs.push({ patient: req.user.id, schedule: schedule.id, medicineName: schedule.medicineName, scheduledTime }); }
    }
    if (logs.length) await DoseLog.bulkWrite(logs.map(d => ({ updateOne: { filter: { schedule: d.schedule, scheduledTime: d.scheduledTime }, update: { $setOnInsert: d }, upsert: true } })));
    next();
  } catch (err) { next(err); }
}
