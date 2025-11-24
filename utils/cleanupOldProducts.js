// utils/cleanupOldProducts.js
const cloudinary = require('../utils/cloudinary'); // your existing helper
const Product = require('../models/productModel');


function extractPublicId(url) {
  // works for .../upload/v123/products/abc123.png
  const m = url?.match(/\/upload\/(?:v\d+\/)?(products\/[^.\/]+)(?:\.[a-z0-9]+)?$/i);
  return m ? m[1] : null; // return products/abc123
}

async function cleanupOldProducts({ days, dryRun=false } = {}) {
  const effectiveDays = Number(days) || parseInt(process.env.RETENTION_DAYS || '90', 10);
  const cutoff = new Date(Date.now() - effectiveDays * 24*60*60*1000);

  const olds = await Product.find({ createdAt: { $lt: cutoff } }).lean();
  if (!olds.length) return { deleted: 0, count: 0 };

  let deleted = 0;
  for (const p of olds) {
    for (const img of (p.images || [])) {
      const pid = img.public_id || extractPublicId(img.url);
      if (!pid) { console.warn('[cleanup] no public_id for', img.url); continue; }
      if (!dryRun) {
        try {
          const resp = await cloudinary.uploader.destroy(pid, { resource_type: 'image', invalidate: true });
          console.log('[cleanup] destroy', pid, '->', resp.result);
        } catch (e) {
          console.error('[cleanup] destroy failed', pid, e.message);
        }
      }
    }
    if (!dryRun) {
      try {
        await Product.deleteOne({ _id: p._id });
        deleted++;
      } catch (e) {
        console.error('[cleanup] delete product failed', p._id, e.message);
      }
    }
  }
  return { deleted, count: olds.length };
}

module.exports = { cleanupOldProducts };