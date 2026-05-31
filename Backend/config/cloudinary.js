import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import env from './env.js';

export function isCloudinaryConfigured() {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
}

export function configureCloudinary() {
  if (!isCloudinaryConfigured()) return false;

  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
  });

  return true;
}

export { cloudinary };

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

export function createTripCoverUploader() {
  configureCloudinary();

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'travel-planner/trips',
      resource_type: 'image',
      format: async (req, file) => {
        const extension = String(file.mimetype || '').split('/')[1];
        if (extension === 'jpeg') return 'jpg';
        return extension || 'jpg';
      },
      public_id: (req, file) => {
        const originalName = String(file.originalname || 'cover')
          .replace(/\.[^/.]+$/, '')
          .replace(/[^\w-]+/g, '-')
          .slice(0, 40);
        const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
        return `${originalName || 'trip-cover'}-${suffix}`;
      },
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        callback(new Error('Only JPG, PNG, and WEBP images are allowed'));
        return;
      }
      callback(null, true);
    },
  });
}

export function extractCloudinaryPublicIdFromUrl(url) {
  try {
    const value = String(url || '');
    if (!value.includes('/upload/')) return '';
    const afterUpload = value.split('/upload/')[1];
    if (!afterUpload) return '';
    const withoutQuery = afterUpload.split('?')[0];
    const segments = withoutQuery.split('/').filter(Boolean);
    const folderIndex = segments.findIndex((segment) => segment === 'travel-planner');
    if (folderIndex === -1) return '';
    const publicIdWithExt = segments.slice(folderIndex).join('/');
    return publicIdWithExt.replace(/\.[a-z0-9]+$/i, '');
  } catch {
    return '';
  }
}
