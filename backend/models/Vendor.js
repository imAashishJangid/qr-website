import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  restaurantName: { type: String, required: true },
  avatar: { type: String, default: '' },
  tables: { type: [String], default: [] },
  resetOtp: { type: String, default: null },
  resetOtpExpires: { type: Date, default: null },
  resetToken: { type: String, default: null },
  resetTokenExpires: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('Vendor', vendorSchema);
