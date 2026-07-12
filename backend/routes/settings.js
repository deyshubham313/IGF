const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { verifyAdmin } = require('../middleware/auth');

// Helper: get or create the singleton settings document
async function getSettings() {
  let settings = await Settings.findOne({ key: 'main' });
  if (!settings) {
    settings = await Settings.create({ key: 'main' });
  }
  return settings;
}

// GET /api/settings — public, returns current settings
router.get('/', async (_req, res) => {
  try {
    const settings = await getSettings();
    const obj = settings.toObject();
    // Never leak Razorpay secret key to public endpoint
    if (obj.razorpay && obj.razorpay.keySecret) {
      obj.razorpay.keySecret = '••••••••••••••••';
    }
    if (obj.razorpay && obj.razorpay.testKeySecret) {
      obj.razorpay.testKeySecret = '••••••••••••••••';
    }
    res.json(obj);
  } catch (err) {
    console.error('Settings GET error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
});

// POST /api/settings — admin only, replaces settings
router.post('/', verifyAdmin, async (req, res) => {
  try {
    if (req.body.razorpay) {
      const existing = await Settings.findOne({ key: 'main' });
      if (existing && existing.razorpay) {
        if (req.body.razorpay.keySecret === '••••••••••••••••') {
          req.body.razorpay.keySecret = existing.razorpay.keySecret;
        }
        if (req.body.razorpay.testKeySecret === '••••••••••••••••') {
          req.body.razorpay.testKeySecret = existing.razorpay.testKeySecret;
        }
      }
    }

    const updated = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: req.body },
      { new: true, upsert: true, runValidators: false }
    );
    res.json({ success: true, message: 'Settings updated successfully', settings: updated });
  } catch (err) {
    console.error('Settings POST error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save settings' });
  }
});

// PATCH /api/settings — admin only, partial update
router.patch('/', verifyAdmin, async (req, res) => {
  try {
    if (req.body.razorpay) {
      const existing = await Settings.findOne({ key: 'main' });
      if (existing && existing.razorpay) {
        if (req.body.razorpay.keySecret === '••••••••••••••••') {
          req.body.razorpay.keySecret = existing.razorpay.keySecret;
        }
        if (req.body.razorpay.testKeySecret === '••••••••••••••••') {
          req.body.razorpay.testKeySecret = existing.razorpay.testKeySecret;
        }
      }
    }

    const updated = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: req.body },
      { new: true, upsert: true, runValidators: false }
    );
    res.json({ success: true, message: 'Settings updated successfully', settings: updated });
  } catch (err) {
    console.error('Settings PATCH error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save settings' });
  }
});

// GET /api/settings/razorpay-status — admin only, returns masked Razorpay info
router.get('/razorpay-status', verifyAdmin, async (_req, res) => {
  try {
    const settings = await getSettings();
    const rz = settings.razorpay || {};
    const mode = rz.mode || 'test';
    const keyId = mode === 'test' ? rz.testKeyId : rz.keyId;
    const keySecret = mode === 'test' ? rz.testKeySecret : rz.keySecret;
    const hasSecret = !!keySecret;
    res.json({
      success: true,
      keyId: keyId ? keyId.slice(0, 12) + '•'.repeat(Math.max(0, keyId.length - 12)) : '',
      hasSecret,
      mode,
      isConfigured: !!(keyId && hasSecret),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/settings/razorpay-keys — admin only, save Razorpay keys
router.post('/razorpay-keys', verifyAdmin, async (req, res) => {
  try {
    const { keyId, keySecret, testKeyId, testKeySecret, mode } = req.body;
    
    // We expect at least one set of keys to be provided depending on mode, but we will just save whatever they give us.
    await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: { 
          'razorpay.keyId': keyId || '', 
          'razorpay.keySecret': keySecret || '', 
          'razorpay.testKeyId': testKeyId || '',
          'razorpay.testKeySecret': testKeySecret || '',
          'razorpay.mode': mode || 'test' 
        } 
      },
      { upsert: true }
    );
    res.json({ success: true, message: 'Razorpay keys saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/settings/razorpay-keys-raw — admin only, returns full keys (for editing)
router.get('/razorpay-keys-raw', verifyAdmin, async (_req, res) => {
  try {
    const settings = await getSettings();
    const rz = settings.razorpay || {};
    res.json({
      success: true,
      keyId: rz.keyId || '',
      keySecret: rz.keySecret || '',
      testKeyId: rz.testKeyId || '',
      testKeySecret: rz.testKeySecret || '',
      mode: rz.mode || 'test',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
