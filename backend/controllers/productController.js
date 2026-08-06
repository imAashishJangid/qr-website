import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import cloudinary, { deleteCloudinaryImage } from '../config/cloudinary.js';

const isDataUri = (value) => typeof value === 'string' && value.startsWith('data:');

// GET /api/vendor/categories
export const listCategories = async (req, res) => {
  try {
    const categories = await Category.find({ vendorId: req.vendor.id }).sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load categories', error: error.message });
  }
};

// POST /api/vendor/categories
export const createCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await Category.create({
      vendorId: req.vendor.id,
      name: name.trim(),
      icon: icon || '🍽️',
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category', error: error.message });
  }
};

// GET /api/vendor/products
export const listProducts = async (req, res) => {
  try {
    const products = await MenuItem.find({ vendorId: req.vendor.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load products', error: error.message });
  }
};

// POST /api/vendor/products
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, categoryId, isVeg, isBestseller, isNewItem, image } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ message: 'name, price and categoryId are required' });
    }

    const category = await Category.findOne({ _id: categoryId, vendorId: req.vendor.id });
    if (!category) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    let imageUrl = '';
    if (isDataUri(image)) {
      const uploaded = await cloudinary.uploader.upload(image, { folder: 'qr-menu/items' });
      imageUrl = uploaded.secure_url;
    } else if (typeof image === 'string') {
      imageUrl = image;
    }

    const product = await MenuItem.create({
      vendorId: req.vendor.id,
      name,
      description: description || '',
      price,
      originalPrice: originalPrice || undefined,
      image: imageUrl,
      categoryId,
      isVeg: isVeg !== undefined ? isVeg : true,
      isBestseller: !!isBestseller,
      isNewItem: !!isNewItem,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

// PUT /api/vendor/products/:id
export const updateProduct = async (req, res) => {
  try {
    const product = await MenuItem.findOne({ _id: req.params.id, vendorId: req.vendor.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, description, price, originalPrice, categoryId, isVeg, isBestseller, isNewItem, image } = req.body;

    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId, vendorId: req.vendor.id });
      if (!category) return res.status(400).json({ message: 'Invalid category' });
      product.categoryId = categoryId;
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (originalPrice !== undefined) product.originalPrice = originalPrice;
    if (isVeg !== undefined) product.isVeg = isVeg;
    if (isBestseller !== undefined) product.isBestseller = isBestseller;
    if (isNewItem !== undefined) product.isNewItem = isNewItem;

    let oldImage;
    if (isDataUri(image)) {
      oldImage = product.image;
      const uploaded = await cloudinary.uploader.upload(image, { folder: 'qr-menu/items' });
      product.image = uploaded.secure_url;
    } else if (typeof image === 'string' && image) {
      product.image = image;
    }

    await product.save();
    if (oldImage) deleteCloudinaryImage(oldImage);
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

// DELETE /api/vendor/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await MenuItem.findOneAndDelete({ _id: req.params.id, vendorId: req.vendor.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.image) deleteCloudinaryImage(product.image);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};
