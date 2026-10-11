import mongoose from 'mongoose';
const scheduleSchema = new mongoose.Schema({
  medicineName: { type: String, required: true, trim: true }, genericName: String,
  dosage: { type: String, required: true }, form: { type: String, default: 'tablet' }, strength: String,
  quantityPerDose: { type: Number, min: 0.1, default: 1 }, times: { type: [String], required: true },
  frequency: { type: String, enum: ['daily','alternate','weekly','weekdays','custom'], default: 'daily' },
  weekdays: [{ type: Number, min: 0, max: 6 }], startDate: { type: Date, required: true }, endDate: Date,
  instructions: String, notes: String, color: { type: String, default: '#ffb400' }, imageUrl: String,
  stock: { type: Number, min: 0, default: 30 }, prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['active','completed','paused','expired'], default: 'active' }
}, { timestamps: true });
scheduleSchema.index({ patient: 1, status: 1, startDate: 1 });
export default mongoose.model('Schedule', scheduleSchema);
