/**
 * Seed script: Reads the original products-data.js CATEGORIES object
 * and inserts all products into MongoDB.
 *
 * Run with: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

// ─── Inline the essential CATEGORIES data ────────────────────────────────────
// We parse the original products-data.js file and import products from it.
const fs = require('fs');
const path = require('path');

// Simple deterministic price generator (same as original site logic)
function simPrice(id) {
  let hash = 0;
  for (let c of id) hash = ((hash << 5) - hash) + c.charCodeAt(0);
  hash = Math.abs(hash);
  const base = 50000 + (hash % 500000);
  const disc = 10 + (hash % 25);
  return { price: Math.round(base / 1000) * 1000, discountPct: disc };
}

let CATEGORIES;
try {
  // Read and evaluate the products-data.js file
  const dataPath = path.join(__dirname, '../assets/products-data.js');
  const dataContent = fs.readFileSync(dataPath, 'utf-8');

  // Execute the file content to get CATEGORIES
  const vm = require('vm');
  const context = {};
  vm.createContext(context);
  CATEGORIES = vm.runInContext(dataContent + '\nCATEGORIES;', context);
  if (!CATEGORIES) {
    throw new Error('CATEGORIES is undefined in VM context');
  }
} catch (err) {
  console.log('⚠️ Failed to parse products-data.js, falling back to fallbackData.json:', err.message);
  try {
    CATEGORIES = require('./fallbackData.json');
  } catch (jsonErr) {
    console.error('❌ Failed to load fallbackData.json:', jsonErr.message);
    process.exit(1);
  }
}

async function seed() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indian-game-factory';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    const productsToInsert = [];

    for (const [catKey, category] of Object.entries(CATEGORIES)) {
      console.log(`📦 Processing category: ${category.name} (${category.products.length} products)`);

      for (const prod of category.products) {
        const { price, discountPct } = simPrice(prod.id);

        // Determine stock status based on tag
        let stock = 'in-stock';
        if (prod.tag === 'PRE-ORDER') stock = 'pre-order';
        else if (prod.tag === 'LIMITED') stock = 'low-stock';

        productsToInsert.push({
          id: prod.id,
          name: prod.name,
          category: catKey,
          categoryName: category.name,
          categoryIcon: category.icon || '',
          image: prod.image,
          images: [prod.image],
          shortDesc: prod.shortDesc || '',
          fullDesc: prod.fullDesc || '',
          specs: prod.specs || [],
          features: prod.features || [],
          tag: prod.tag || '',
          price,
          discountPct,
          stock,
          isActive: true
        });
      }
    }

    const inserted = await Product.insertMany(productsToInsert, { ordered: false });
    console.log(`✅ Seeded ${inserted.length} products across ${Object.keys(CATEGORIES).length} categories`);

    // Print summary
    for (const [catKey, category] of Object.entries(CATEGORIES)) {
      console.log(`   • ${category.name}: ${category.products.length} products`);
    }

    console.log('\n🎉 Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
