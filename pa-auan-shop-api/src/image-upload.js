import sharp from 'sharp';

export async function optimizeUpload(buffer) {
  try {
    const image = sharp(buffer, { limitInputPixels: 24_000_000, failOn: 'error' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages ?? 1) > 1) throw new Error('unsupported');
    for (const quality of [78, 65, 50]) {
      const data = await image.clone().rotate().resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true }).webp({ quality }).toBuffer();
      if (data.length <= 200 * 1024) return data;
    }
    throw new Error('too complex');
  } catch {
    const error = new Error('ไม่สามารถใช้รูปนี้ได้ กรุณาเลือก JPEG, PNG หรือ WebP ที่มีขนาดหรือรายละเอียดน้อยลง');
    error.status = 400;
    throw error;
  }
}
