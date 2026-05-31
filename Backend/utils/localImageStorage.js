import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coversDir = path.resolve(__dirname, '../uploads/covers');

const extensionByMime = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function ensureCoversUploadDir() {
  await fs.mkdir(coversDir, { recursive: true });
}

function getFileExtension(mimetype) {
  return extensionByMime[mimetype] || 'jpg';
}

export async function saveCoverImageLocally(file, tripId) {
  await ensureCoversUploadDir();

  const extension = getFileExtension(file.mimetype);
  const filename = `${tripId}-${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(coversDir, filename);

  await fs.writeFile(filePath, file.buffer);

  return `/uploads/covers/${filename}`;
}

export function buildPublicImageUrl(relativePath, baseUrl) {
  const normalizedBase = String(baseUrl || '').replace(/\/$/, '');
  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function deleteLocalCoverImageIfExists(imageUrl, baseUrl) {
  if (!imageUrl || !imageUrl.includes('/uploads/covers/')) return;

  const filename = imageUrl.split('/uploads/covers/').pop()?.split('?')[0];
  if (!filename) return;

  const filePath = path.join(coversDir, filename);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
