import cron from 'node-cron';
import Schedule from '../models/Schedule.js';
import DoseLog from '../models/DoseLog.js';

export function startReminderScheduler(io) {
  return cron.schedule('* * * * *', async () => {
    try {
      const now = new Date(); const minute = new Date(now); minute.setSeconds(0,0);
      const schedules = await Schedule.find({ status: 'active', startDate: { $lte: now }, $or: [{ endDate: null }, { endDate: { $gte: now } }] });
      for (const schedule of schedules) {
        const slot = now.toTimeString().slice(0,5);
        if (!schedule.times.includes(slot)) continue;
        await DoseLog.updateOne({ schedule: schedule.id, scheduledTime: minute }, { $setOnInsert: { patient: schedule.patient, schedule: schedule.id, medicineName: schedule.medicineName, scheduledTime: minute } }, { upsert: true });
        io.to(`user:${schedule.patient}`).emit('dose:reminder', { scheduleId: schedule.id, medicineName: schedule.medicineName, dosage: schedule.dosage, scheduledTime: minute, imageUrl: schedule.imageUrl });
      }
      const grace = Number(process.env.GRACE_MINUTES) || 30;
      const overdue = await DoseLog.find({ status: 'pending', scheduledTime: { $lt: new Date(now - grace * 60000) } });
      if (overdue.length) {
        await DoseLog.updateMany({ _id: { $in: overdue.map(d=>d.id) } }, { $set: { status: 'missed' } });
        for (const dose of overdue) io.to(`user:${dose.patient}`).emit('dose:missed', { doseId: dose.id, medicineName: dose.medicineName });
      }
    } catch (error) { console.error('Reminder scheduler failed:', error.message); }
  });
}
