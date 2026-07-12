const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product');
const { verifyAdmin } = require('../middleware/auth');

// ── Multer: memory storage (no disk write) ─────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max per file
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

// POST /api/products/upload-image — converts file to base64 & returns it
router.post('/upload-image', verifyAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' });
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    res.json({ success: true, url: base64, mimetype: req.file.mimetype, size: req.file.size });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products/upload-images — multi-image upload (up to 10)
router.post('/upload-images', verifyAdmin, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided' });
    }
    const urls = req.files.map(f => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`);
    res.json({ success: true, urls });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/categories — MUST be before /:id
router.get('/categories', async (_req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          name: { $first: '$categoryName' },
          icon: { $first: '$categoryIcon' },
          count: { $sum: 1 },
        },
      },
      { $sort: { name: 1 } },
    ]);
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products — list with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, tag, limit, page } = req.query;
    const query = { isActive: true };

    if (category && category !== 'all') query.category = category;
    if (tag) query.tag = tag;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDesc: { $regex: search, $options: 'i' } },
        { categoryName: { $regex: search, $options: 'i' } },
      ];
    }

    const sortMap = {
      'name-asc': { name: 1 },
      'name-desc': { name: -1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
    };
    const sortObj = sortMap[sort] || { createdAt: 1 };

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, parseInt(limit) || 100);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortObj).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.json({ success: true, total, page: pageNum, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id — single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id, isActive: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products — create (admin)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id — update (admin)
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id — soft delete (admin)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Error handler for multer
router.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Image too large. Maximum 8MB per image.' });
  }
  res.status(400).json({ success: false, message: err.message });
});

module.exports = router;
