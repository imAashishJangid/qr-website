import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

// Relative URL so it goes through Vite's dev proxy (web) or VITE_API_URL (Capacitor APK).
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Created once at module scope (not inside the effect) so React 18 StrictMode's
// dev-only double-invoke of effects doesn't open/tear down/reopen the connection,
// which was aborting the handshake mid-flight through Vite's ws proxy.
const socketInstance = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
});

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    setSocket(socketInstance);
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};

export default SocketContext;
