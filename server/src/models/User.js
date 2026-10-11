import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false, minlength: 8 },
  role: { type: String, enum: ['ADMIN', 'DOCTOR', 'PATIENT', 'CAREGIVER'], default: 'PATIENT' },
  approved: { type: Boolean, default: false },
  linkedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  linkedPatient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  preferences: { language: { type: String, default: 'en' }, theme: { type: String, default: 'industrial' }, elderlyMode: { type: Boolean, default: false } }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.comparePassword = function (candidate) { return bcrypt.compare(candidate, this.password); };
export default mongoose.model('User', userSchema);
