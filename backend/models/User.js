const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, unique: true, sparse: true, lowercase: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  cart: [{
    productId: String,
    productName: String,
    productImage: String,
    category: String,
    quantity: { type: Number, default: 1 }
  }],
  wishlist: [{
    productId: String,
    productName: String,
    productImage: String,
    category: String
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
