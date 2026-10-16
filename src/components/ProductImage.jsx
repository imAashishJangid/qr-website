import React, { useState } from 'react';

const FALLBACK = 'https://placehold.co/400x300/E5E7EB/111827?text=Food';

// Shows the whole photo (object-contain, never cropped or stretched) inside a fixed-ratio frame,
// so cards stay aligned. The empty space around a photo whose shape differs from the frame is
// filled with a blurred copy of the same photo instead of bare bars.
// `className` sizes the frame (e.g. "w-full aspect-[4/3]" or "w-16 h-16").
const ProductImage = ({ src, alt, className = '', imgClassName = '', lazy = true }) => {
  const [failed, setFailed] = useState(false);
  const url = !src || failed ? FALLBACK : src;

  return (
    <div className={`relative overflow-hidden bg-gray-100 dark:bg-gray-700 ${className}`}>
      <img
        src={url}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60"
        loading={lazy ? 'lazy' : undefined}
      />
      <img
        src={url}
        alt={alt}
        className={`relative w-full h-full object-contain ${imgClassName}`}
        loading={lazy ? 'lazy' : undefined}
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export default ProductImage;
