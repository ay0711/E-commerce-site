const imagePool = [
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
];

const capsuleNames = ['Noir', 'Sahara', 'Pearl', 'Velvet', 'Aura', 'Luna', 'Sienna', 'Gold'];

const categoryBlueprints = [
  {
    category: 'Luxury Sets',
    descriptors: ['Signature', 'Regal', 'Elite', 'Opulent', 'Heritage'],
    itemNouns: ['Draped Set', 'Flow Co-ord', 'Silk Ensemble'],
    basePrice: 132,
    priceStep: 5,
    stockBase: 18,
  },
  {
    category: 'Essentials',
    descriptors: ['Soft', 'Minimal', 'Tailored', 'Classic', 'Modern'],
    itemNouns: ['Linen Set', 'Shirt', 'Blouse'],
    basePrice: 68,
    priceStep: 4,
    stockBase: 26,
  },
  {
    category: 'Occasion Wear',
    descriptors: ['Gala', 'Evening', 'Festive', 'Sculpted', 'Majestic'],
    itemNouns: ['Dress', 'Wrap Dress', 'Event Kaftan'],
    basePrice: 144,
    priceStep: 6,
    stockBase: 14,
  },
  {
    category: 'Accessories',
    descriptors: ['Ayanfe', 'Premium', 'Structured', 'Statement', 'Artisan'],
    itemNouns: ['Tote', 'Crossbody', 'Clutch'],
    basePrice: 38,
    priceStep: 3,
    stockBase: 34,
  },
];

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildCategoryProducts = (blueprint, perCategoryTarget) => {
  const products = [];
  let sequence = 0;

  while (products.length < perCategoryTarget) {
    const descriptor = blueprint.descriptors[sequence % blueprint.descriptors.length];
    const capsule = capsuleNames[Math.floor(sequence / blueprint.descriptors.length) % capsuleNames.length];
    const noun = blueprint.itemNouns[Math.floor(sequence / (blueprint.descriptors.length * capsuleNames.length)) % blueprint.itemNouns.length];

    const name = `${descriptor} ${capsule} ${noun}`;
    const slug = `${slugify(name)}-${slugify(blueprint.category)}-${sequence + 1}`;
    const price = blueprint.basePrice + (sequence % 9) * blueprint.priceStep;
    const stock = blueprint.stockBase + ((sequence * 3) % 22);
    const rating = Number((4.6 + ((sequence % 5) * 0.1)).toFixed(1));
    const featured = sequence % 7 === 0;

    products.push({
      name,
      slug,
      description: `Ayanfe ${blueprint.category.toLowerCase()} piece designed for premium comfort, confident styling, and day-to-night elegance.`,
      category: blueprint.category,
      price,
      stock,
      image: imagePool[sequence % imagePool.length],
      rating,
      featured,
    });

    sequence += 1;
  }

  return products;
};

const buildCatalogProducts = () => {
  const perCategoryTarget = 30;
  const allProducts = [];

  categoryBlueprints.forEach((blueprint) => {
    allProducts.push(...buildCategoryProducts(blueprint, perCategoryTarget));
  });

  return allProducts;
};

module.exports = buildCatalogProducts();
