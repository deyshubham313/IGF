const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  productInterest: { type: String, default: '' },
  location: { type: String, default: '' },
  budget: { type: String, default: '' },
  message: { type: String, default: '' },
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
  source: { type: String, default: 'website' }
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
