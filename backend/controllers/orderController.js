import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Vendor from '../models/Vendor.js';
import { getIO } from '../socket/socket.js';

const GST_RATE = 0.05;

const generateOrderNumber = async () => {
  const count = await Order.countDocuments();
  return `ORD${String(1000 + count + 1)}`;
};

// POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const { vendorId, tableId, items, note, customerId } = req.body;

    if (!vendorId || !tableId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'vendorId, tableId and items are required' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    if (!vendor.tables.includes(String(tableId))) {
      return res.status(400).json({ message: 'Invalid table number for this restaurant' });
    }

    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        const menuItem = await MenuItem.findById(item.menuItemId);
        if (!menuItem) throw new Error(`Menu item not found: ${item.menuItemId}`);
        if (menuItem.vendorId.toString() !== String(vendorId)) {
          throw new Error(`Menu item does not belong to this vendor: ${item.menuItemId}`);
        }
        return {
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
        };
      })
    );

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const gst = Number((subtotal * GST_RATE).toFixed(2));
    const total = Number((subtotal + gst).toFixed(2));

    const order = await Order.create({
      vendorId,
      orderNumber: await generateOrderNumber(),
      tableId: String(tableId),
      customerId: customerId || undefined,
      items: resolvedItems,
      note: note || '',
      subtotal,
      gst,
      total,
    });

    getIO().to(`vendor-${vendorId}`).emit('newOrder', order);

    res.status(201).json({ order });
  } catch (error) {
    res.status(400).json({ message: 'Failed to place order', error: error.message });
  }
};

// GET /api/orders/:id
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load order', error: error.message });
  }
};

// GET /api/orders/active/:vendorId/:tableId?customerId=...
// Most recent non-completed order for this table, so the customer can find their
// order status even if localStorage was cleared or they're on a different device.
// When customerId is given, the lookup is scoped to it — otherwise a new customer
// scanning a table another customer is still actively ordering at would incorrectly
// see that other customer's in-progress order.
export const getActiveOrderForTable = async (req, res) => {
  try {
    const { vendorId, tableId } = req.params;
    const { customerId } = req.query;
    const query = {
      vendorId,
      tableId: String(tableId),
      status: { $ne: 'completed' },
    };
    if (customerId) query.customerId = customerId;

    const order = await Order.findOne(query).sort({ createdAt: -1 });

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load active order', error: error.message });
  }
};

// GET /api/orders/history/:customerId
// Every order (any status) this anonymous device has ever placed, newest first —
// powers the "Previous" tab and never depends on any per-table lookup.
export const getOrderHistoryForCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const orders = await Order.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load order history', error: error.message });
  }
};
