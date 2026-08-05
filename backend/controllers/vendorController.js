import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Vendor from '../models/Vendor.js';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';

const signToken = (vendor) =>
  jwt.sign({ id: vendor._id, email: vendor.email, name: vendor.name }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const toUser = (vendor) => ({
  id: vendor._id,
  name: vendor.name,
  email: vendor.email,
  restaurantName: vendor.restaurantName,
});

// POST /api/vendor/signup
export const signup = async (req, res) => {
  try {
    const { name, email, password, restaurantName } = req.body;
    if (!name || !email || !password || !restaurantName) {
      return res.status(400).json({ message: 'name, email, password and restaurantName are required' });
    }

    const existing = await Vendor.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const vendor = await Vendor.create({ name, email, password: hashedPassword, restaurantName });

    const token = signToken(vendor);
    res.status(201).json({ token, user: toUser(vendor) });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
};

// POST /api/vendor/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(vendor);
    res.json({ token, user: toUser(vendor) });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// GET /api/vendor/verify
export const verify = async (req, res) => {
  const vendor = await Vendor.findById(req.vendor.id).select('-password');
  if (!vendor) return res.status(401).json({ message: 'Vendor not found' });
  res.json({ user: toUser(vendor) });
};

// PUT /api/vendor/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }

    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(401).json({ message: 'Vendor not found' });

    const isMatch = await bcrypt.compare(currentPassword, vendor.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    vendor.password = await bcrypt.hash(newPassword, 10);
    await vendor.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};

// GET /api/vendor/stats
export const getStats = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const [totalOrders, orders, pendingOrders, preparingOrders, readyOrders, totalProducts] = await Promise.all([
      Order.countDocuments({ vendorId }),
      Order.find({ vendorId }, 'total tableId'),
      Order.countDocuments({ vendorId, status: 'pending' }),
      Order.countDocuments({ vendorId, status: 'preparing' }),
      Order.countDocuments({ vendorId, status: 'ready' }),
      MenuItem.countDocuments({ vendorId }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalCustomers = new Set(orders.map((o) => o.tableId)).size;

    res.json({
      totalOrders,
      totalRevenue: Math.round(totalRevenue),
      totalCustomers,
      totalProducts,
      pendingOrders,
      preparingOrders,
      readyOrders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load stats', error: error.message });
  }
};

// GET /api/vendor/recent-orders
export const getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.find({ vendorId: req.vendor.id }).sort({ createdAt: -1 }).limit(10);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load recent orders', error: error.message });
  }
};

// GET /api/vendor/tables
export const listTables = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id).select('tables');
    if (!vendor) return res.status(401).json({ message: 'Vendor not found' });
    res.json(vendor.tables);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load tables', error: error.message });
  }
};

// POST /api/vendor/tables
export const addTable = async (req, res) => {
  try {
    const { number } = req.body;
    if (!number || !String(number).trim()) {
      return res.status(400).json({ message: 'Table number is required' });
    }
    const tableNumber = String(number).trim();

    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(401).json({ message: 'Vendor not found' });

    if (vendor.tables.includes(tableNumber)) {
      return res.status(409).json({ message: 'This table already exists' });
    }

    vendor.tables.push(tableNumber);
    await vendor.save();

    res.status(201).json(vendor.tables);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add table', error: error.message });
  }
};
