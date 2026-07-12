const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'igf_super_secret_jwt_key_2026';

const signToken = (id, role = 'user') =>
  jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please sign in.' });
    }
    const user = await User.create({ name, email, password, phone });
    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }
    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await User.findOne({
      role: 'admin',
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const token = signToken(user._id, 'admin');
    res.json({ success: true, token, role: 'admin' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role === 'admin') {
      return res.json({ success: true, user: { id: 'admin', name: 'Admin', role: 'admin' } });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// POST /api/auth/update-cart
router.post('/update-cart', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const user = await User.findByIdAndUpdate(decoded.id, { cart: req.body.cart }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, cart: user.cart });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/auth/update-wishlist
router.post('/update-wishlist', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const user = await User.findByIdAndUpdate(decoded.id, { wishlist: req.body.wishlist }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
