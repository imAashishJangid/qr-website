import Order from '../models/Order.js';
import { getIO } from '../socket/socket.js';

// GET /api/vendor/orders
export const getVendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({ vendorId: req.vendor.id }).sort({ createdAt: -1 }).limit(100);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load orders', error: error.message });
  }
};

// PUT /api/vendor/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findOne({ _id: req.params.id, vendorId: req.vendor.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    await order.save();

    const io = getIO();
    io.to(`order-${order._id}`).emit('orderStatusUpdate', {
      status: order.status,
      estimatedTime: order.estimatedTime,
    });
    io.to(`vendor-${order.vendorId}`).emit('orderUpdated', order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};
