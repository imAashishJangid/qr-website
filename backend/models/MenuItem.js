import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String, default: '' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  isVeg: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },
  isNewItem: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.isNew = ret.isNewItem;
      return ret;
    },
  },
});

export default mongoose.model('MenuItem', menuItemSchema);
