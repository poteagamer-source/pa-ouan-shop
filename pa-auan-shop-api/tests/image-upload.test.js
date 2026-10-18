import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { optimizeUpload } from '../src/image-upload.js';

test('large photos are resized to WebP within the storage limit', async () => {
  const input = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: '#ff6600' } }).jpeg().toBuffer();
  const output = await optimizeUpload(input);
  const meta = await sharp(output).metadata();
  assert.equal(meta.format, 'webp');
  assert.equal(meta.width, 800);
  assert.equal(meta.height, 600);
  assert.ok(output.length <= 204800);
});

test('invalid and SVG uploads cannot be stored as images', async () => {
  for (const input of [Buffer.from('not an image'), Buffer.from('<svg width="10" height="10"></svg>')]) {
    await assert.rejects(optimizeUpload(input), { status: 400 });
  }
});

test('small transparent PNG remains transparent and is not enlarged', async () => {
  const input = await sharp({ create: { width: 40, height: 20, channels: 4, background: '#00000000' } }).png().toBuffer();
  const meta = await sharp(await optimizeUpload(input)).metadata();
  assert.equal(meta.width, 40);
  assert.equal(meta.height, 20);
  assert.equal(meta.hasAlpha, true);
});
