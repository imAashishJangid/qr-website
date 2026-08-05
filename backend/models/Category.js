import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  name: { type: String, required: true },
  icon: { type: String, default: '🍽️' },
  order: { type: Number, default: 0 },
});

export default mongoose.model('Category', categorySchema);
