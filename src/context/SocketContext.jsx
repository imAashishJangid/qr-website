import React, { createContext, useContext } from "react";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socket = null; // baad me yahan socket.io connect kar sakta hai

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