import React from 'react';

const Logo = ({ light = false }) => (
  <div className="flex items-center gap-2">
    <div className="w-9 h-9 overflow-hidden rounded-xl shadow-md shadow-red-500/30 flex-shrink-0">
      <img src="/applogo.jpeg" alt="HiaQr" className="w-full h-full object-cover" />
    </div>
    <span className={`font-display font-bold ${light ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
      HiaQr
    </span>
  </div>
);

export default Logo;
