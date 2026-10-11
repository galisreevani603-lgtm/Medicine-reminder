import mongoose from 'mongoose';
const medicineSchema = new mongoose.Schema({
  medicineName: { type: String, required: true, trim: true }, genericName: String,
  form: { type: String, enum: ['tablet','capsule','syrup','injection','drops','inhaler','ointment'], default: 'tablet' },
  strength: String, description: String, interactions: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
export default mongoose.model('Medicine', medicineSchema);
