import sharp from 'sharp';
import { readdir, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../public/images/', import.meta.url));
const manifest = {};
let originalBytes = 0;
let optimizedBytes = 0;
for (const name of await readdir(directory)) {
  if (!name.endsWith('.png')) continue;
  const source = `${directory}/${name}`;
  const outputName = name.replace(/\.png$/, '.webp');
  await sharp(source).rotate().resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 }).toFile(`${directory}/${outputName}`);
  originalBytes += (await stat(source)).size;
  optimizedBytes += (await stat(`${directory}/${outputName}`)).size;
  manifest[`/images/${name}`] = `/images/${outputName}`;
}
await writeFile(new URL('../src/data/optimized-images.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ images: Object.keys(manifest).length, originalBytes, optimizedBytes }));
