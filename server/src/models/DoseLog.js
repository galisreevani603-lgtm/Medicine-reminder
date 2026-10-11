import mongoose from 'mongoose';
const doseLogSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
  medicineName: { type: String, required: true }, scheduledTime: { type: Date, required: true },
  takenTime: Date, status: { type: String, enum: ['pending','taken','missed','skipped','snoozed'], default: 'pending' },
  note: String, snoozedUntil: Date
}, { timestamps: true });
doseLogSchema.index({ schedule: 1, scheduledTime: 1 }, { unique: true });
export default mongoose.model('DoseLog', doseLogSchema);
