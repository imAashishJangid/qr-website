import React from 'react';

const Logo = ({ light = false }) => (
  <div className="flex items-center gap-2">
    <div className="w-9 h-9 flex items-center justify-center text-lg bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-md shadow-red-500/30 flex-shrink-0">
      🍽️
    </div>
    <span className={`font-display font-bold ${light ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
      Smart QR Food
    </span>
  </div>
);

export default Logo;
