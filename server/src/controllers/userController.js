import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import DoseLog from '../models/DoseLog.js';

export async function myPatients(req, res, next) {
  try {
    const patients = await User.find({ linkedDoctor: req.user.id, role: 'PATIENT' }).select('name email createdAt');
    const data = await Promise.all(patients.map(async p => { const total = await DoseLog.countDocuments({ patient: p.id }); const taken = await DoseLog.countDocuments({ patient: p.id, status: 'taken' }); return { ...p.toObject(), adherence: total ? Math.round(taken/total*100) : 0, activeSchedules: await Schedule.countDocuments({ patient: p.id, status: 'active' }) }; }));
    res.json({ success: true, message: 'Patients loaded', data });
  } catch (err) { next(err); }
}
export async function adminOverview(req, res, next) {
  try {
    const [users, activeSchedules, doses, medicines, pendingDoctors] = await Promise.all([User.countDocuments(), Schedule.countDocuments({ status: 'active' }), DoseLog.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]), (await import('../models/Medicine.js')).default.countDocuments(), User.countDocuments({ role: 'DOCTOR', approved: false })]);
    const map = Object.fromEntries(doses.map(d => [d._id,d.count])); const total = Object.values(map).reduce((a,b)=>a+b,0);
    res.json({ success: true, message: 'System analytics loaded', data: { users, activeSchedules, medicines, pendingDoctors, doses: map, systemAdherence: total ? Math.round((map.taken||0)/total*100) : 0 } });
  } catch (err) { next(err); }
}
export async function adminUsers(req, res, next) {
  try { const data = await User.find().select('name email role approved createdAt').sort({ createdAt: -1 }); res.json({ success: true, message: 'Users loaded', data }); } catch (err) { next(err); }
}
export async function approveDoctor(req, res, next) {
  try { const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'DOCTOR' }, { approved: true }, { new: true }).select('name email role approved'); if (!user) return res.status(404).json({ success: false, message: 'Doctor not found' }); res.json({ success: true, message: 'Doctor approved', data: user }); } catch (err) { next(err); }
}
export async function connectPatient(req, res, next) {
  try {
    const doctor = await User.findOne({ email: req.body.doctorEmail?.toLowerCase(), role: 'DOCTOR', approved: true });
    if (!doctor) return res.status(404).json({ success: false, message: 'Approved doctor not found' });
    await User.findByIdAndUpdate(req.user.id, { linkedDoctor: doctor.id });
    res.json({ success: true, message: `Linked with Dr. ${doctor.name}`, data: { doctor: { id: doctor.id, name: doctor.name, email: doctor.email } } });
  } catch (err) { next(err); }
}
