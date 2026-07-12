const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const { verifyAdmin } = require('../middleware/auth');

// POST /api/inquiries — submit inquiry (public)
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, productInterest, location, budget, message } = req.body;
    if (!name || !phone || !email) {
      return res.status(400).json({ success: false, message: 'Name, phone and email are required' });
    }
    const inquiry = await Inquiry.create({ name, phone, email, productInterest, location, budget, message });
    res.status(201).json({ success: true, inquiry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/inquiries — list all (admin)
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { productInterest: { $regex: search, $options: 'i' } },
      ];
    }
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 20);
    const [inquiries, total] = await Promise.all([
      Inquiry.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Inquiry.countDocuments(query),
    ]);
    res.json({ success: true, total, page: pageNum, inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/inquiries/:id/status — update status (admin)
router.put('/:id/status', verifyAdmin, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, inquiry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/inquiries/:id — delete (admin)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, message: 'Inquiry deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
