const mongoose = require('mongoose');

const specSchema = new mongoose.Schema({
  label: { type: String, required: true },
  val: { type: String, required: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  categoryName: { type: String, required: true },
  categoryIcon: { type: String, default: '' },
  image: { type: String, required: true },
  images: [{ type: String }],
  shortDesc: { type: String, default: '' },
  fullDesc: { type: String, default: '' },
  specs: [specSchema],
  features: [{ type: String }],
  tag: { type: String, default: '' },
  price: { type: Number, default: 0 },
  discountPct: { type: Number, default: 0 },
  stock: { type: String, enum: ['in-stock', 'low-stock', 'out-of-stock', 'pre-order'], default: 'in-stock' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ category: 1 });
productSchema.index({ name: 'text', shortDesc: 'text' });

module.exports = mongoose.model('Product', productSchema);
