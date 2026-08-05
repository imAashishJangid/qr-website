import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    socket.on('join-table', (tableId) => {
      socket.join(`table-${tableId}`);
    });

    socket.on('join-order', (orderId) => {
      socket.join(`order-${orderId}`);
    });

    socket.on('join-vendor', (vendorId) => {
      socket.join(`vendor-${vendorId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
