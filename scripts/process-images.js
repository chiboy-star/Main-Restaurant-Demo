import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { encode } from 'blurhash';

const sourceDir = path.resolve('assets', 'source');
const outputDir = path.resolve('public', 'images');
const imagesJsonPath = path.resolve('images.json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Gallery mapping
const galleryMapping = {
  'gallery-jollof': 'dish-smoky-jollof',
  'gallery-suya': 'dish-suya-platter',
  'gallery-asun': 'dish-asun',
  'gallery-efo': 'dish-efo-riro',
  'gallery-catfish': 'dish-catfish-soup',
  'gallery-dodo': 'dish-dodo-plantain',
  'gallery-puffpuff': 'dish-puff-puff',
  'gallery-chapman': 'dish-chapman',
  'gallery-okro': 'dish-seafood-okro',
  'gallery-pasta': 'dish-chicken-linguine'
};

async function processAllImages() {
  console.log('Processing images with sharp and blurhash...');
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

  const imagesCatalog = {};

  for (const file of files) {
    const id = path.parse(file).name;
    const inputPath = path.join(sourceDir, file);

    console.log(`Processing ${id}...`);

    const image = sharp(inputPath);
    const meta = await image.metadata();
    const originalWidth = meta.width || 1200;
    const originalHeight = meta.height || 800;
    const aspectRatio = originalHeight / originalWidth;

    // 1. Compute BlurHash
    // Resize down to 32x32 raw pixel buffer
    const { data: rawPixels, info } = await sharp(inputPath)
      .resize(32, Math.round(32 * aspectRatio), { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const blurhashString = encode(
      new Uint8ClampedArray(rawPixels),
      info.width,
      info.height,
      4,
      4
    );

    // 2. Generate multi-resolution AVIF and WebP (480, 800, 1200 px)
    const sizes = [480, 800, 1200];
    const avifPaths = {};
    const webpPaths = {};

    for (const size of sizes) {
      const targetHeight = Math.round(size * aspectRatio);

      // AVIF
      const avifFileName = `${id}-${size}.avif`;
      const avifOutPath = path.join(outputDir, avifFileName);
      await sharp(inputPath)
        .resize(size, targetHeight, { fit: 'cover' })
        .avif({ quality: 75, effort: 4 })
        .toFile(avifOutPath);
      avifPaths[size] = `/images/${avifFileName}`;

      // WebP
      const webpFileName = `${id}-${size}.webp`;
      const webpOutPath = path.join(outputDir, webpFileName);
      await sharp(inputPath)
        .resize(size, targetHeight, { fit: 'cover' })
        .webp({ quality: 80, effort: 4 })
        .toFile(webpOutPath);
      webpPaths[size] = `/images/${webpFileName}`;
    }

    // 3. Primary fallback WebP image at standard display size (e.g. 600px)
    // Ensures hero is < 80 KB and menu images are < 150 KB
    const primaryWebpPath = path.join(outputDir, `${id}.webp`);
    const isHero = id === 'hero-dish';
    const primaryQuality = isHero ? 75 : 80;
    const primaryMax = isHero ? 600 : 700;

    await sharp(inputPath)
      .resize(primaryMax, Math.round(primaryMax * aspectRatio), { fit: 'cover' })
      .webp({ quality: primaryQuality })
      .toFile(primaryWebpPath);

    const primarySize = fs.statSync(primaryWebpPath).size;
    const primarySizeKb = (primarySize / 1024).toFixed(1);

    if (isHero && primarySize > 80 * 1024) {
      console.warn(`Hero size is ${primarySizeKb} KB (target: < 80 KB)`);
    } else {
      console.log(`✓ ${id}.webp generated: ${primarySizeKb} KB`);
    }

    imagesCatalog[id] = {
      id,
      blurhash: blurhashString,
      width: originalWidth,
      height: originalHeight,
      aspectRatio,
      avif: avifPaths,
      webp: webpPaths,
      primary: `/images/${id}.webp`,
      sizeBytes: primarySize
    };
  }

  // Generate gallery image aliases
  for (const [galleryId, targetId] of Object.entries(galleryMapping)) {
    const srcFile = path.join(outputDir, `${targetId}.webp`);
    const destFile = path.join(outputDir, `${galleryId}.webp`);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`Linked ${galleryId}.webp -> ${targetId}.webp`);
    }
  }

  // Also create og-image.jpg
  const ogPath = path.join(outputDir, 'og-image.jpg');
  const heroSource = path.join(sourceDir, 'hero-dish.jpg');
  if (fs.existsSync(heroSource)) {
    await sharp(heroSource)
      .resize(1200, 630, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(ogPath);
    console.log('✓ Generated og-image.jpg');
  }

  // Write images.json
  fs.writeFileSync(imagesJsonPath, JSON.stringify(imagesCatalog, null, 2));
  console.log(`Successfully generated ${imagesJsonPath} with ${Object.keys(imagesCatalog).length} optimized images.`);
}

processAllImages().catch(err => {
  console.error('Processing error:', err);
  process.exit(1);
});
