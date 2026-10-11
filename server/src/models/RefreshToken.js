import mongoose from 'mongoose';
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, token: { type: String, required: true, unique: true }, expiresAt: { type: Date, required: true, expires: 0 } }, { timestamps: true });
export default mongoose.model('RefreshToken', schema);
