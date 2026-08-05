import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import { getIO } from '../socket/socket.js';

const GST_RATE = 0.05;

const generateOrderNumber = async () => {
  const count = await Order.countDocuments();
  return `ORD${String(1000 + count + 1)}`;
};

// POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const { vendorId, tableId, items, note } = req.body;

    if (!vendorId || !tableId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'vendorId, tableId and items are required' });
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

// GET /api/orders/active/:vendorId/:tableId
// Most recent non-completed order for this table, so the customer can find their
// order status even if localStorage was cleared or they're on a different device.
export const getActiveOrderForTable = async (req, res) => {
  try {
    const { vendorId, tableId } = req.params;
    const order = await Order.findOne({
      vendorId,
      tableId: String(tableId),
      status: { $ne: 'completed' },
    }).sort({ createdAt: -1 });

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load active order', error: error.message });
  }
};
