const mongoose = require('mongoose');

const timelineStepSchema = new mongoose.Schema({
  title: String,
  desc: String,
  date: String,
  status: { type: String, enum: ['done', 'active', 'pending'], default: 'pending' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    pan: { type: String, default: '' },
    aadhaar: { type: String, default: '' },
    city: { type: String, default: '' },
    pinCode: { type: String, default: '' },
    state: { type: String, default: '' }
  },
  product: {
    id: String,
    name: String,
    image: String,
    category: String
  },
  amount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String, default: '' },
  paymentMethod: { type: String, enum: ['razorpay', 'upi', 'pending'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  utrNumber: { type: String, default: '' },
  status: {
    type: String,
    enum: ['confirmed', 'processing', 'dispatched', 'in-transit', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  trackingNumber: { type: String, default: '' },
  timeline: [timelineStepSchema],
  message: { type: String, default: '' },
  eta: { type: Date },
  cancelRequested: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-generate orderId before save if not set
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    this.orderId = `IGF-${year}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
