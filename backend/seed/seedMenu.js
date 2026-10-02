require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') }); // .env in the backend root
const mongoose = require('mongoose');
const Menuitems = require('../Models/Menuitems');

const TG = 'Tandoori / Grill Items';
const PL = 'Non-Veg Platters';
const SH = 'Shawarma Items';

const fullHalf = (full, half) => [
  { label: 'Full', price: full },
  { label: 'Half', price: half },
];

const items = [
  { name: 'Tandoori Chicken', category: TG, variants: fullHalf(440, 230) },
  { name: 'Alfaham Chicken', category: TG, variants: fullHalf(440, 230) },
  { name: 'Grilled Chicken', category: TG, variants: fullHalf(440, 230) },
  { name: 'Pudina Kabab', category: TG, variants: fullHalf(340, 180) },
  { name: 'Tandoori Kabab', category: TG, variants: fullHalf(340, 180) },
  { name: 'Kalmi Kabab (Leg Piece)', category: TG, variants: fullHalf(340, 180) },

  { name: 'Tandoori Platter', description: 'Tandoori + Kabab + Kalmi Leg Piece', category: PL, variants: fullHalf(1050, 550) },
  { name: 'Grill & Tandoori Platter', description: 'Grill + Tandoori + Kalmi Leg Piece', category: PL, variants: fullHalf(1150, 600) },

  { name: 'Regular Shawarma', category: SH, variants: [{ label: 'Regular', price: 130 }] },
  { name: 'SP. Shawarma', category: SH, variants: [{ label: 'Special', price: 160 }] },
  { name: 'Plate Shawarma', category: SH, variants: [{ label: 'Plate', price: 180 }] },
];

(async () => {
  try {
    const uri = process.env.MONGO_URI ;
    if (!uri) throw new Error('No Mongo connection string found. Check the variable name in your .env');
    await mongoose.connect(uri);
    await Menuitems.deleteMany({});
    await Menuitems.insertMany(items);
    console.log(`Seeded ${items.length} menu items`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
})();