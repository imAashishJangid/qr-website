import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Best-effort cleanup of a previously uploaded image when it gets replaced.
// Silently no-ops on non-Cloudinary URLs (e.g. seed data placeholders) or parse failures.
export const deleteCloudinaryImage = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return;
  try {
    const afterUpload = url.split('/upload/')[1];
    if (!afterUpload) return;
    const parts = afterUpload.split('/');
    if (/^v\d+$/.test(parts[0])) parts.shift();
    const last = parts.pop();
    const publicId = [...parts, last.replace(/\.[^/.]+$/, '')].join('/');
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // ignore — cleanup is best-effort
  }
};

export default cloudinary;
