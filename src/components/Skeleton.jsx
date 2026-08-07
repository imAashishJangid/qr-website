import React from 'react';

// Base pulsing block — pass sizing/shape via className (h-4 w-24 rounded-lg, etc.)
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`} />
);

export default Skeleton;
