const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const Settings = require('../models/Settings');

// Helper: get settings
async function getSettings() {
  let settings = await Settings.findOne({ key: 'main' });
  if (!settings) {
    settings = await Settings.create({ key: 'main' });
  }
  return settings;
}

// POST /api/payments/validate-coupon
router.post('/validate-coupon', async (req, res) => {
  try {
    const code = (req.body.code || '').toUpperCase().trim();
    const settings = await getSettings();
    const coupon = (settings.coupons || []).find(c => c.code === code);

    if (coupon) {
      // Check expiry
      if (coupon.expiry) {
        const today = new Date().toISOString().split('T')[0];
        if (coupon.expiry < today) {
          return res.status(400).json({ success: false, message: 'Coupon code has expired!' });
        }
      }
      if (coupon.uses >= coupon.maxUses) {
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached!' });
      }
      return res.json({ success: true, code, discount: coupon.pct, message: `${coupon.pct}% discount applied!` });
    }
    res.status(400).json({ success: false, message: 'Invalid coupon code.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments/create-razorpay-order
router.post('/create-razorpay-order', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount. Minimum ₹1.' });
    }

    const settings = await getSettings();
    const rz = settings.razorpay || {};
    const mode = rz.mode || 'test';
    const keyId = mode === 'test' ? rz.testKeyId : rz.keyId;
    const keySecret = mode === 'test' ? rz.testKeySecret : rz.keySecret;

    // Return a mock order if no real keys configured
    if (!keyId || keyId.includes('your_key') || keyId === 'rzp_test_your_key_here') {
      return res.json({
        success: true,
        mock: true,
        order: {
          id: `order_mock_${Date.now()}`,
          amount: Math.round(Number(amount) * 100),
          currency: 'INR',
        },
        key: keyId,
      });
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    res.json({ success: true, mock: false, order, key: keyId });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    let errorMsg = err.message || 'Unknown error';
    if (err.error && err.error.description) {
      errorMsg = err.error.description;
    } else if (err.description) {
      errorMsg = err.description;
    }
    res.status(500).json({ success: false, message: 'Failed to create payment order: ' + errorMsg });
  }
});

// POST /api/payments/verify — verify Razorpay signature & update order
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const settings = await getSettings();
    const rz = settings.razorpay || {};
    const mode = rz.mode || 'test';
    const keySecret = mode === 'test' ? rz.testKeySecret : rz.keySecret;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', keySecret || '')
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed — signature mismatch' });
    }

    // Update order if orderId provided
    if (orderId) {
      await Order.findOneAndUpdate(
        { orderId },
        {
          paymentStatus: 'paid',
          paymentMethod: 'razorpay',
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
        }
      );
    }

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments/upi-confirm — manual UPI/UTR submission
router.post('/upi-confirm', async (req, res) => {
  try {
    const { orderId, utrNumber } = req.body;
    if (!utrNumber || utrNumber.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid UTR number (min 10 characters)' });
    }

    if (orderId) {
      await Order.findOneAndUpdate(
        { orderId },
        {
          paymentMethod: 'upi',
          paymentStatus: 'pending',
          utrNumber: utrNumber.trim(),
        }
      );
    }

    res.json({
      success: true,
      message: 'UPI payment confirmation received. Our team will verify your payment within 2–4 hours.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
