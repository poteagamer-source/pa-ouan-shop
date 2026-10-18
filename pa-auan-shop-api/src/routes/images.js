import { Router, raw } from 'express';
import { createHash } from 'node:crypto';
import { query } from '../db.js';
import { requireRole } from '../auth.js';
import { optimizeUpload } from '../image-upload.js';

const router = Router();
router.post('/', requireRole('manager'), raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), async (req, res, next) => {
  try {
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'กรุณาเลือกรูป JPEG, PNG หรือ WebP' });
    const data = await optimizeUpload(req.body);
    const id = createHash('sha256').update(data).digest('hex');
    await query('INSERT INTO product_images (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [id, data]);
    res.status(201).json({ url: `/api/images/${id}.webp`, bytes: data.length });
  } catch (error) { next(error); }
});

router.get('/:filename', async (req, res, next) => {
  if (!/^[a-f0-9]{64}\.webp$/.test(req.params.filename)) return res.status(404).end();
  try {
    const id = req.params.filename.slice(0, -5);
    const { rows } = await query('SELECT data FROM product_images WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).end();
    res.set({ 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', ETag: `"${id}"` });
    res.send(rows[0].data);
  } catch (error) { next(error); }
});

router.use((error, _req, res, next) => {
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'รูปภาพต้องมีขนาดไม่เกิน 5 MB' });
  if (error.status === 400) return res.status(400).json({ error: error.message });
  next(error);
});
export default router;
