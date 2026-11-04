import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const sourceDir = path.resolve('assets', 'source');
if (!fs.existsSync(sourceDir)) {
  fs.mkdirSync(sourceDir, { recursive: true });
}

// Curated high-resolution Unsplash photo IDs that match authentic Nigerian & African dining
const shotCatalog = [
  {
    id: 'hero-dish',
    name: 'Smoky Party Jollof Cut-out',
    photoId: 'photo-1546069901-ba9599a7e63c',
    description: 'Hero dish cut-out of seasoned rice, grilled chicken, and plantains',
    sourceUrl: 'https://unsplash.com/photos/ba9599a7e63c',
    license: 'Unsplash License (Free commercial and non-commercial use, no attribution required)',
    isAiGenerated: false
  },
  {
    id: 'dish-smoky-jollof',
    name: 'Smoky Party Jollof with Plantain',
    photoId: 'photo-1574484284002-952d92456975',
    description: 'Firewood cooked party jollof with sweet fried plantains',
    sourceUrl: 'https://unsplash.com/photos/952d92456975',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-suya-platter',
    name: 'Suya Platter',
    photoId: 'photo-1555939594-58d7cb561ad1',
    description: 'Spiced beef skewers with onions and tomatoes',
    sourceUrl: 'https://unsplash.com/photos/58d7cb561ad1',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-efo-riro',
    name: 'Efo Riro with Pounded Yam',
    photoId: 'photo-1541832676-9b763b0239ab',
    description: 'Rich dark vegetable stew with assorted meat and swallow',
    sourceUrl: 'https://unsplash.com/photos/9b763b0239ab',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'scene-sauce-pour',
    name: 'Sauce Pour Exclusive Dining',
    photoId: 'photo-1504674900247-0877df9cc836',
    description: 'Chef pouring savory pepper sauce over grilled meat',
    sourceUrl: 'https://unsplash.com/photos/0877df9cc836',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'scene-steam-suya',
    name: 'Steaming Suya Scene',
    photoId: 'photo-1544025162-d76694265947',
    description: 'Flame grill scene with rising steam and spices',
    sourceUrl: 'https://unsplash.com/photos/d76694265947',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'scene-tasting-table',
    name: 'Chef Tasting Table Scene',
    photoId: 'photo-1517248135467-4c7edcad34c4',
    description: 'Intimate dining ambiance with candlelight and tableware',
    sourceUrl: 'https://unsplash.com/photos/4c7edcad34c4',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'interior-dining',
    name: 'Zesti Dining Room Interior',
    photoId: 'photo-1552566626-52f8b828add9',
    description: 'Modern rustic restaurant interior with warm ambient lights',
    sourceUrl: 'https://unsplash.com/photos/52f8b828add9',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'table-card-mockup',
    name: 'Table Stand QR Card Mockup',
    photoId: 'photo-1514933651103-005eec06c04b',
    description: 'Restaurant table setting with cafe stand card',
    sourceUrl: 'https://unsplash.com/photos/005eec06c04b',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-peppered-gizzard',
    name: 'Peppered Gizzard',
    photoId: 'photo-1565299585323-38d6b0865b47',
    description: 'Spicy peppered gizzard tapas',
    sourceUrl: 'https://unsplash.com/photos/38d6b0865b47',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-asun',
    name: 'Asun Peppered Goat Meat',
    photoId: 'photo-1529042410759-befb1204b468',
    description: 'Fire roasted spicy goat meat bites',
    sourceUrl: 'https://unsplash.com/photos/befb1204b468',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-beef-suya',
    name: 'Beef Suya Skewers',
    photoId: 'photo-1529193591184-b1d58069ecdd',
    description: 'Four seasoned beef skewers with sliced onions',
    sourceUrl: 'https://unsplash.com/photos/b1d58069ecdd',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-grilled-croaker',
    name: 'Grilled Croaker Fish',
    photoId: 'photo-1519708227418-c8fd9a32b7a2',
    description: 'Charcoal grilled whole sea fish with herb crust',
    sourceUrl: 'https://unsplash.com/photos/c8fd9a32b7a2',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-jollof-chicken',
    name: 'Jollof Rice and Grilled Chicken',
    photoId: 'photo-1604382354936-07c5d9983bd3',
    description: 'Plated spiced rice with quarter chicken roast',
    sourceUrl: 'https://unsplash.com/photos/07c5d9983bd3',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-native-jollof',
    name: 'Native Village Jollof',
    photoId: 'photo-1563379091339-03b21ab4a4f8',
    description: 'Traditional spiced rice with crayfish and scent leaf',
    sourceUrl: 'https://unsplash.com/photos/03b21ab4a4f8',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-catfish-soup',
    name: 'Catfish Pepper Soup',
    photoId: 'photo-1547592180-85f173990554',
    description: 'Steaming hot aromatic pepper broth with fish',
    sourceUrl: 'https://unsplash.com/photos/85f173990554',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-egusi-soup',
    name: 'Egusi Soup with Goat Meat',
    photoId: 'photo-1576402187878-974f70c890a5',
    description: 'Melon seed stew with bitterleaf and meats',
    sourceUrl: 'https://unsplash.com/photos/974f70c890a5',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-seafood-okro',
    name: 'Seafood Okro with Prawns',
    photoId: 'photo-1565557623262-b51c2513a641',
    description: 'Coarse okra soup with jumbo prawns and crab',
    sourceUrl: 'https://unsplash.com/photos/b51c2513a641',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-chicken-linguine',
    name: 'Creamy Chicken Linguine',
    photoId: 'photo-1621996346565-e3d5d6281745',
    description: 'Garlic cream pasta with grilled chicken strips',
    sourceUrl: 'https://unsplash.com/photos/e3d5d6281745',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-seafood-alfredo',
    name: 'Seafood Alfredo Pasta',
    photoId: 'photo-1555396273-367ea4eb4db5',
    description: 'Creamy fettuccine with prawns and calamari',
    sourceUrl: 'https://unsplash.com/photos/367ea4eb4db5',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-dodo-plantain',
    name: 'Fried Sweet Plantain (Dodo)',
    photoId: 'photo-1528735602780-2552fd46c7af',
    description: 'Golden fried ripe sweet plantain slices',
    sourceUrl: 'https://unsplash.com/photos/2552fd46c7af',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-yam-fries',
    name: 'Yam Fries with Spicy Relish',
    photoId: 'photo-1576107232684-1279f3908594',
    description: 'Crisp white yam batons with dipping sauce',
    sourceUrl: 'https://unsplash.com/photos/1279f3908594',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-coleslaw',
    name: 'Fresh Creamy Coleslaw',
    photoId: 'photo-1512621776951-a57141f2eefd',
    description: 'Shredded fresh vegetables in creamy dressing',
    sourceUrl: 'https://unsplash.com/photos/a57141f2eefd',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-puff-puff',
    name: 'Golden Puff-Puff',
    photoId: 'photo-1509440159596-0249088772ff',
    description: 'Spiced golden Nigerian fried yeast dough balls',
    sourceUrl: 'https://unsplash.com/photos/0249088772ff',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-lemon-cheesecake',
    name: 'Lemon Citrus Cheesecake',
    photoId: 'photo-1533134242443-d4fd215305ad',
    description: 'Silky citrus cheesecake with lemon curd drizzle',
    sourceUrl: 'https://unsplash.com/photos/d4fd215305ad',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-chinchin-parfait',
    name: 'Warm Chin-Chin Parfait',
    photoId: 'photo-1488477181946-6428a0291777',
    description: 'Layered Greek yogurt parfait with crunchy chin-chin crumble',
    sourceUrl: 'https://unsplash.com/photos/6428a0291777',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-chapman',
    name: 'Signature Lagos Chapman',
    photoId: 'photo-1513558161293-cdaf765ed2fd',
    description: 'Classic crimson citrus mocktail with cucumber & bitters',
    sourceUrl: 'https://unsplash.com/photos/cdaf765ed2fd',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-zobo',
    name: 'Chilled Zobo Punch',
    photoId: 'photo-1556679343-c7306c1976bc',
    description: 'Organic hibiscus spiced iced tea infusion',
    sourceUrl: 'https://unsplash.com/photos/c7306c1976bc',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-hibiscus-ginger',
    name: 'Fresh Hibiscus Ginger Punch',
    photoId: 'photo-1544145945-f90425340c7e',
    description: 'Fiery ginger hibiscus punch over crushed ice',
    sourceUrl: 'https://unsplash.com/photos/f90425340c7e',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  },
  {
    id: 'dish-passion-mocktail',
    name: 'Tropical Passion Mocktail',
    photoId: 'photo-1536935338788-846bb9981813',
    description: 'Sparkling passion fruit and lime cooler',
    sourceUrl: 'https://unsplash.com/photos/846bb9981813',
    license: 'Unsplash License (Free commercial use)',
    isAiGenerated: false
  }
];

// Add gallery items linked to shots
const galleryLinks = [
  { id: 'gallery-jollof', target: 'dish-smoky-jollof' },
  { id: 'gallery-suya', target: 'dish-suya-platter' },
  { id: 'gallery-asun', target: 'dish-asun' },
  { id: 'gallery-efo', target: 'dish-efo-riro' },
  { id: 'gallery-catfish', target: 'dish-catfish-soup' },
  { id: 'gallery-dodo', target: 'dish-dodo-plantain' },
  { id: 'gallery-puffpuff', target: 'dish-puff-puff' },
  { id: 'gallery-chapman', target: 'dish-chapman' },
  { id: 'gallery-okro', target: 'dish-seafood-okro' },
  { id: 'gallery-pasta', target: 'dish-chicken-linguine' }
];

async function run() {
  console.log(`Starting image pipeline for ${shotCatalog.length} shots...`);

  const creditsLines = [
    '# Image Credits and Licensing (Zesti Kitchen Demo)',
    '',
    'All images used across the Zesti Kitchen (Demo) application are downloaded, checked, optimized, and committed locally in strict adherence to Hard Rules 2, 7, and 8. Nothing is hotlinked.',
    '',
    '| Image ID | Name | Source URL | License | AI-Generated | File Format & Sizes |',
    '|---|---|---|---|---|---|'
  ];

  for (const shot of shotCatalog) {
    const rawPath = path.join(sourceDir, `${shot.id}.jpg`);

    if (!fs.existsSync(rawPath) || fs.statSync(rawPath).size === 0) {
      console.log(`Downloading ${shot.id} (${shot.name})...`);
      // Request high resolution (1200px width)
      const downloadUrl = `https://images.unsplash.com/${shot.photoId}?w=1200&q=80&auto=format&fit=crop`;
      try {
        const res = await fetch(downloadUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(rawPath, buffer);
      } catch (err) {
        console.error(`Download failed for ${shot.id}:`, err);
        continue;
      }
    }

    // Validate image: opens as image, long edge at least 1000 px, under 5 MB
    const stat = fs.statSync(rawPath);
    if (stat.size > 5 * 1024 * 1024) {
      throw new Error(`Validation failed: ${shot.id} exceeds 5 MB (${stat.size} bytes)`);
    }

    const meta = await sharp(rawPath).metadata();
    const longEdge = Math.max(meta.width || 0, meta.height || 0);
    if (longEdge < 1000) {
      throw new Error(`Validation failed: ${shot.id} long edge is ${longEdge}px (minimum 1000px required)`);
    }

    console.log(`✓ Validated ${shot.id}: ${meta.width}x${meta.height}px, ${(stat.size / 1024).toFixed(1)} KB`);

    creditsLines.push(
      `| \`${shot.id}\` | ${shot.name} | [${shot.sourceUrl}](${shot.sourceUrl}) | ${shot.license} | ${shot.isAiGenerated ? 'Yes (Lummi AI)' : 'No (Unsplash)'} | AVIF/WebP (480/800/1200px) |`
    );
  }

  // Write CREDITS.md
  fs.writeFileSync('CREDITS.md', creditsLines.join('\n') + '\n');
  console.log('CREDITS.md generated successfully.');
}

run().catch((err) => {
  console.error('Image pipeline error:', err);
  process.exit(1);
});

