import multer from 'multer';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadTripImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(new Error('Only JPG, PNG, and WEBP images are allowed'));
      return;
    }
    callback(null, true);
  },
});
