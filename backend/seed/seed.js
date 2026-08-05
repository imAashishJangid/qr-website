import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import cloudinary from '../config/cloudinary.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import Vendor from '../models/Vendor.js';

// Dummy placeholder images (same service already used as the app's image fallback)
// get uploaded to Cloudinary so every menu item ends up with a real, hosted image URL.
const uploadDummyImage = async (label, hex) => {
  const sourceUrl = `https://placehold.co/400x300/${hex}/FFFFFF?text=${encodeURIComponent(label)}`;
  const result = await cloudinary.uploader.upload(sourceUrl, {
    folder: 'qr-menu/items',
    public_id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    overwrite: true,
  });
  return result.secure_url;
};

const categoriesData = [
  { name: 'Starters', icon: '🥗', order: 1 },
  { name: 'Main Course', icon: '🍛', order: 2 },
  { name: 'Beverages', icon: '🥤', order: 3 },
  { name: 'Desserts', icon: '🍰', order: 4 },
];

const itemsData = [
  { name: 'Paneer Tikka', category: 'Starters', price: 220, originalPrice: 260, hex: 'FF6B6B', isVeg: true, isBestseller: true, rating: 4.5, description: 'Chargrilled cottage cheese marinated in spiced yogurt.' },
  { name: 'Chicken Seekh Kebab', category: 'Starters', price: 260, hex: 'F97316', isVeg: false, isNew: true, rating: 4.3, description: 'Minced chicken skewers grilled with aromatic spices.' },
  { name: 'Veg Spring Rolls', category: 'Starters', price: 180, hex: 'FDBA74', isVeg: true, rating: 4.1, description: 'Crispy rolls stuffed with fresh vegetables.' },
  { name: 'Butter Chicken', category: 'Main Course', price: 320, originalPrice: 360, hex: 'DC2626', isVeg: false, isBestseller: true, rating: 4.8, description: 'Creamy tomato gravy simmered with tender chicken.' },
  { name: 'Paneer Butter Masala', category: 'Main Course', price: 280, hex: 'EF4444', isVeg: true, isBestseller: true, rating: 4.6, description: 'Rich and creamy tomato-based paneer curry.' },
  { name: 'Dal Makhani', category: 'Main Course', price: 220, hex: 'B91C1C', isVeg: true, rating: 4.4, description: 'Slow-cooked black lentils finished with cream and butter.' },
  { name: 'Veg Biryani', category: 'Main Course', price: 240, hex: 'FB923C', isVeg: true, isNew: true, rating: 4.2, description: 'Fragrant basmati rice layered with spiced vegetables.' },
  { name: 'Mango Lassi', category: 'Beverages', price: 90, hex: 'FBBF24', isVeg: true, rating: 4.5, description: 'Chilled yogurt smoothie blended with fresh mango.' },
  { name: 'Masala Chai', category: 'Beverages', price: 50, hex: 'A16207', isVeg: true, rating: 4.3, description: 'Classic spiced tea brewed with milk.' },
  { name: 'Cold Coffee', category: 'Beverages', price: 110, hex: '78350F', isVeg: true, isNew: true, rating: 4.4, description: 'Chilled coffee blended with ice cream.' },
  { name: 'Fresh Lime Soda', category: 'Beverages', price: 70, hex: '65A30D', isVeg: true, rating: 4.0, description: 'Refreshing lime soda, sweet or salted.' },
  { name: 'Gulab Jamun', category: 'Desserts', price: 90, hex: 'EA580C', isVeg: true, isBestseller: true, rating: 4.7, description: 'Soft milk dumplings soaked in rose-flavoured syrup.' },
  { name: 'Chocolate Brownie', category: 'Desserts', price: 130, hex: '78350F', isVeg: true, isNew: true, rating: 4.5, description: 'Warm fudgy brownie served with chocolate sauce.' },
  { name: 'Rasmalai', category: 'Desserts', price: 110, hex: 'F59E0B', isVeg: true, rating: 4.6, description: 'Soft cottage cheese dumplings in saffron milk.' },
];

const run = async () => {
  await connectDB();

  console.log('Creating demo vendor...');
  await Vendor.deleteMany({ email: process.env.ADMIN_EMAIL });
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  const vendor = await Vendor.create({
    name: 'Demo Vendor',
    email: process.env.ADMIN_EMAIL,
    password: hashedPassword,
    restaurantName: 'Smart QR Food',
    tables: ['1'],
  });

  console.log('Clearing existing menu data for this vendor...');
  await Promise.all([
    Category.deleteMany({ vendorId: vendor._id }),
    MenuItem.deleteMany({ vendorId: vendor._id }),
  ]);

  console.log('Creating categories...');
  const categoryDocs = await Category.insertMany(
    categoriesData.map((c) => ({ ...c, vendorId: vendor._id }))
  );
  const categoryByName = Object.fromEntries(categoryDocs.map((c) => [c.name, c._id]));

  console.log('Uploading dummy images to Cloudinary and creating menu items...');
  for (const item of itemsData) {
    const image = await uploadDummyImage(item.name, item.hex);
    await MenuItem.create({
      vendorId: vendor._id,
      name: item.name,
      description: item.description,
      price: item.price,
      originalPrice: item.originalPrice,
      image,
      categoryId: categoryByName[item.category],
      isVeg: item.isVeg,
      isBestseller: !!item.isBestseller,
      isNewItem: !!item.isNew,
      rating: item.rating,
    });
    console.log(`  + ${item.name}`);
  }

  console.log('\nSeed complete!');
  console.log(`Vendor login -> email: ${process.env.ADMIN_EMAIL}  password: ${process.env.ADMIN_PASSWORD}`);
  console.log(`Demo menu URL -> /menu/${vendor._id}/1`);
  process.exit(0);
};

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
