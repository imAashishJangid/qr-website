import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';

// GET /api/menu/:vendorId/:tableId
export const getMenu = async (req, res) => {
  try {
    const { vendorId, tableId } = req.params;
    const items = await MenuItem.find({ vendorId }).sort({ createdAt: 1 });
    res.json({ vendorId, tableId, items });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load menu', error: error.message });
  }
};

// GET /api/menu/:vendorId/categories
export const getCategories = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const categories = await Category.find({ vendorId }).sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load categories', error: error.message });
  }
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/menu/:vendorId/search?q=&category=&minPrice=&maxPrice=&veg=
export const searchMenu = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { q, category, minPrice, maxPrice, veg } = req.query;

    const filter = { vendorId };

    if (q?.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ name: regex }, { description: regex }];
    }

    if (category && category !== 'all') {
      filter.categoryId = category;
    }

    if (veg === 'true' || veg === 'false') {
      filter.isVeg = veg === 'true';
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const items = await MenuItem.find(filter).sort({ createdAt: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};
