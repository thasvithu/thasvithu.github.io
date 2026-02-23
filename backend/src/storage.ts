import crypto from 'node:crypto';
import { config } from './config.js';

type UploadResult = {
  objectPath: string;
  publicUrl: string;
};

export async function uploadToSupabaseStorage(file: Express.Multer.File): Promise<UploadResult> {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey || !config.supabaseStorageBucket) {
    throw new Error('Supabase storage is not configured');
  }

  const ext = extensionFromMime(file.mimetype);
  const safeName = String(file.originalname || 'upload').replace(/[^a-zA-Z0-9_.-]/g, '-');
  const objectPath = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeName}${ext}`;

  const uploadUrl = `${config.supabaseUrl}/storage/v1/object/${config.supabaseStorageBucket}/${objectPath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      apikey: config.supabaseServiceRoleKey,
      'Content-Type': file.mimetype || 'application/octet-stream',
      'x-upsert': 'true'
    },
    body: new Uint8Array(file.buffer)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Storage upload failed: ${text || response.statusText}`);
  }

  const publicUrl = `${config.supabaseUrl}/storage/v1/object/public/${config.supabaseStorageBucket}/${objectPath}`;
  return { objectPath, publicUrl };
}

function extensionFromMime(mime: string): string {
  if (!mime) return '';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  return '';
}
