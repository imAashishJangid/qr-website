import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Vendor from '../models/Vendor.js';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import cloudinary, { deleteCloudinaryImage } from '../config/cloudinary.js';
import { sendOtpEmail } from '../config/mailer.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

const signToken = (vendor) =>
  jwt.sign({ id: vendor._id, email: vendor.email, name: vendor.name }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const toUser = (vendor) => ({
  id: vendor._id,
  name: vendor.name,
  email: vendor.email,
  restaurantName: vendor.restaurantName,
  avatar: vendor.avatar || '',
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

// POST /api/vendor/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(404).json({ message: "You don't have an account with this email" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    vendor.resetOtp = await bcrypt.hash(otp, 10);
    vendor.resetOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    vendor.resetToken = null;
    vendor.resetTokenExpires = null;
    await vendor.save();

    await sendOtpEmail(vendor.email, otp);

    res.json({ message: 'An OTP has been sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

// POST /api/vendor/verify-otp
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(404).json({ message: "You don't have an account with this email" });

    if (!vendor.resetOtp || !vendor.resetOtpExpires || vendor.resetOtpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(otp, vendor.resetOtp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    vendor.resetToken = resetToken;
    vendor.resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    vendor.resetOtp = null;
    vendor.resetOtpExpires = null;
    await vendor.save();

    res.json({ message: 'OTP verified', resetToken });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
};

// POST /api/vendor/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'Email, resetToken and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(404).json({ message: "You don't have an account with this email" });

    if (
      !vendor.resetToken ||
      !vendor.resetTokenExpires ||
      vendor.resetTokenExpires < new Date() ||
      vendor.resetToken !== resetToken
    ) {
      return res.status(400).json({ message: 'Reset session expired. Please start again.' });
    }

    vendor.password = await bcrypt.hash(newPassword, 10);
    vendor.resetToken = null;
    vendor.resetTokenExpires = null;
    await vendor.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};

// PUT /api/vendor/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email, restaurantName, image } = req.body;

    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(401).json({ message: 'Vendor not found' });

    if (email && email !== vendor.email) {
      const existing = await Vendor.findOne({ email, _id: { $ne: vendor._id } });
      if (existing) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }
      vendor.email = email;
    }

    if (name !== undefined) vendor.name = name;
    if (restaurantName !== undefined) vendor.restaurantName = restaurantName;

    let oldAvatar;
    if (typeof image === 'string' && image.startsWith('data:')) {
      oldAvatar = vendor.avatar;
      const uploaded = await cloudinary.uploader.upload(image, { folder: 'qr-menu/avatars' });
      vendor.avatar = uploaded.secure_url;
    }

    await vendor.save();
    if (oldAvatar) deleteCloudinaryImage(oldAvatar);
    res.json({ user: toUser(vendor) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// GET /api/vendor/stats
export const getStats = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const [totalOrders, orders, pendingOrders, preparingOrders, readyOrders, totalProducts, vegCount, categoryAgg] =
      await Promise.all([
        Order.countDocuments({ vendorId }),
        Order.find({ vendorId }, 'total tableId'),
        Order.countDocuments({ vendorId, status: 'pending' }),
        Order.countDocuments({ vendorId, status: 'preparing' }),
        Order.countDocuments({ vendorId, status: 'ready' }),
        MenuItem.countDocuments({ vendorId }),
        MenuItem.countDocuments({ vendorId, isVeg: true }),
        MenuItem.aggregate([
          { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
          { $group: { _id: '$categoryId', count: { $sum: 1 } } },
        ]),
      ]);

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalCustomers = new Set(orders.map((o) => o.tableId)).size;

    const categoryDocs = await Category.find({ _id: { $in: categoryAgg.map((c) => c._id) } }, 'name icon');
    const categoryMap = new Map(categoryDocs.map((c) => [String(c._id), c]));
    const categories = categoryAgg
      .map((c) => ({
        name: categoryMap.get(String(c._id))?.name || 'Other',
        icon: categoryMap.get(String(c._id))?.icon || '🍽️',
        count: c.count,
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      totalOrders,
      totalRevenue: Math.round(totalRevenue),
      totalCustomers,
      totalProducts,
      vegCount,
      nonVegCount: totalProducts - vegCount,
      categories,
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
    const { date, page = 1, limit = 10 } = req.query;
    const query = { vendorId: req.vendor.id };

    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59.999`);
      if (!Number.isNaN(start.getTime())) {
        query.createdAt = { $gte: start, $lte: end };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Order.countDocuments(query),
    ]);

    res.json({
      orders,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
      currentPage: pageNum,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load recent orders', error: error.message });
  }
};

// GET /api/vendor/revenue?period=today|month|date&date=YYYY-MM-DD
export const getRevenueSummary = async (req, res) => {
  try {
    const { period = 'today', date } = req.query;
    const now = new Date();
    let start;
    let end;

    if (period === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'date' && date) {
      start = new Date(`${date}T00:00:00`);
      end = new Date(`${date}T23:59:59.999`);
      if (Number.isNaN(start.getTime())) {
        return res.status(400).json({ message: 'Invalid date' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid period or missing date' });
    }

    const orders = await Order.find(
      { vendorId: req.vendor.id, createdAt: { $gte: start, $lte: end } },
      'total'
    );

    const totalRevenue = Math.round(orders.reduce((sum, o) => sum + o.total, 0));
    res.json({ period, start, end, totalRevenue, totalOrders: orders.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load revenue summary', error: error.message });
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

// PUT /api/vendor/tables/:number
export const updateTable = async (req, res) => {
  try {
    const oldNumber = req.params.number;
    const { newNumber } = req.body;
    if (!newNumber || !String(newNumber).trim()) {
      return res.status(400).json({ message: 'New table number is required' });
    }
    const trimmedNewNumber = String(newNumber).trim();

    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(401).json({ message: 'Vendor not found' });

    const index = vendor.tables.indexOf(oldNumber);
    if (index === -1) return res.status(404).json({ message: 'Table not found' });

    if (trimmedNewNumber !== oldNumber && vendor.tables.includes(trimmedNewNumber)) {
      return res.status(409).json({ message: 'This table already exists' });
    }

    vendor.tables[index] = trimmedNewNumber;
    await vendor.save();

    res.json(vendor.tables);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update table', error: error.message });
  }
};

// DELETE /api/vendor/tables/:number
export const deleteTable = async (req, res) => {
  try {
    const number = req.params.number;

    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(401).json({ message: 'Vendor not found' });

    if (!vendor.tables.includes(number)) {
      return res.status(404).json({ message: 'Table not found' });
    }

    vendor.tables = vendor.tables.filter((t) => t !== number);
    await vendor.save();

    res.json(vendor.tables);
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete table', error: error.message });
  }
};
