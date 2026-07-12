const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { verifyAdmin } = require('../middleware/auth');

function buildTimeline(status) {
  const steps = [
    { title: 'Order Confirmed', desc: 'Your order has been placed and confirmed.' },
    { title: 'Processing', desc: 'We are preparing your order for dispatch.' },
    { title: 'Dispatched', desc: 'Your order has been handed to the courier.' },
    { title: 'In Transit', desc: 'Your order is on its way to you.' },
    { title: 'Delivered', desc: 'Your order has been delivered successfully.' },
  ];
  const statusIndex = {
    confirmed: 0, processing: 1, dispatched: 2, 'in-transit': 3, delivered: 4,
  };
  const activeIndex = statusIndex[status] ?? 0;
  return steps.map((step, i) => ({
    ...step,
    status: i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending',
    date: i <= activeIndex
      ? new Date(Date.now() - (activeIndex - i) * 86400000 * 2).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
        })
      : '',
  }));
}

// GET /api/orders/stats — MUST be before /:id (admin)
router.get('/stats', verifyAdmin, async (_req, res) => {
  try {
    const [totalOrders, revenueAgg, pendingOrders, deliveredOrders, productCount] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Order.countDocuments({ status: { $in: ['confirmed', 'processing', 'dispatched', 'in-transit'] } }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ paymentStatus: 'paid' }),
    ]);
    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: revenueAgg[0]?.total || 0,
        pendingOrders,
        deliveredOrders,
        paidOrders: productCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/track/:orderId — public order tracking
router.get('/track/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId.toUpperCase() });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found. Please check the order ID.' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders — admin list
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const { status, paymentStatus, search, page, limit } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ];
    }
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 20);
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Order.countDocuments(query),
    ]);
    res.json({ success: true, total, page: pageNum, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders — create new order (public)
router.post('/', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 90000) + 10000;
    const orderId = `IGF-${year}-${random}`;
    const eta = new Date();
    eta.setDate(eta.getDate() + 7);
    const trackingNumber = `IGFIN${Date.now().toString().slice(-8)}`;

    const order = new Order({
      ...req.body,
      orderId,
      trackingNumber,
      eta,
      timeline: buildTimeline(req.body.status || 'confirmed'),
    });
    await order.save();
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/status — update status (admin, by MongoDB _id)
router.put('/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    order.timeline = buildTimeline(status);
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:orderId/cancel — cancel request (public, by orderId string)
router.put('/:orderId/cancel', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId.toUpperCase() },
      { cancelRequested: true },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Cancellation request submitted', order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
