import fs from 'node:fs';
import path from 'node:path';

function validate() {
  console.log('Running Hard Rule 7: Image integrity and presence check...');

  const imagesJsonPath = path.resolve('images.json');
  if (!fs.existsSync(imagesJsonPath)) {
    console.error('FAIL: images.json is missing! Run image pipeline first.');
    process.exit(1);
  }

  const images = JSON.parse(fs.readFileSync(imagesJsonPath, 'utf-8'));
  const menuData = JSON.parse(fs.readFileSync(path.resolve('src/data/menu.json'), 'utf-8'));

  let failures = 0;

  // Check every dish referenced in menu.json
  for (const dish of menuData.items) {
    if (!dish.image_id) {
      console.error(`FAIL: Dish "${dish.name}" (${dish.id}) has no image_id.`);
      failures++;
      continue;
    }

    if (!images[dish.image_id]) {
      console.error(`FAIL: Dish image_id "${dish.image_id}" not found in images.json.`);
      failures++;
      continue;
    }

    const expectedFile = path.resolve('public', 'images', `${dish.image_id}.webp`);
    if (!fs.existsSync(expectedFile)) {
      console.error(`FAIL: Image file missing from disk: ${expectedFile}`);
      failures++;
    }
  }

  // Check hero dish and scenes
  const criticalImages = [
    'hero-dish.webp',
    'scene-sauce-pour.webp',
    'scene-steam-suya.webp',
    'interior-dining.webp',
    'placeholder-dish.svg',
    'logo.svg'
  ];

  for (const img of criticalImages) {
    const fullPath = path.resolve('public', 'images', img);
    if (!fs.existsSync(fullPath)) {
      console.error(`FAIL: Critical asset missing: ${fullPath}`);
      failures++;
    }
  }

  if (failures > 0) {
    console.error(`\nBuild FAILED: ${failures} missing or broken image(s) detected.`);
    process.exit(1);
  }

  console.log('✓ All referenced images verified. Zero broken images. Hard Rule 7 PASSED.');
}

validate();

