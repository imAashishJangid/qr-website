import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  restaurantName: { type: String, required: true },
  avatar: { type: String, default: '' },
  tables: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.model('Vendor', vendorSchema);
