import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  orderNumber: { type: String, required: true, unique: true },
  tableId: { type: String, required: true },
  // Anonymous per-device id (no customer login) so each customer only ever sees
  // their own orders, even when the same table number is reused by someone else
  // later. Optional so pre-existing orders created before this field don't break.
  customerId: { type: String, index: true },
  items: { type: [orderItemSchema], required: true },
  note: { type: String, default: '' },
  subtotal: { type: Number, required: true },
  gst: { type: Number, required: true },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'completed'],
    default: 'pending',
  },
  estimatedTime: { type: Number, default: 15 },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
