import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

if (!process.env.CLOUDFLARE_R2_ACCOUNT_ID) {
  throw new Error('CLOUDFLARE_R2_ACCOUNT_ID is not set');
}

if (!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) {
  throw new Error('CLOUDFLARE_R2_ACCESS_KEY_ID is not set');
}

if (!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
  throw new Error('CLOUDFLARE_R2_SECRET_ACCESS_KEY is not set');
}

if (!process.env.CLOUDFLARE_R2_BUCKET_NAME) {
  throw new Error('CLOUDFLARE_R2_BUCKET_NAME is not set');
}

const ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || `https://${BUCKET_NAME}.${ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Initialize R2 Client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export interface UploadOptions {
  file: File | Buffer;
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadFile({ file, key, contentType, metadata }: UploadOptions) {
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata,
  });

  await r2Client.send(command);

  return {
    key,
    url: `${PUBLIC_URL}/${key}`,
  };
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Get a signed URL for private file access
 * @param key - File key in R2
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getSignedUrlForFile(key: string, expiresIn: number = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn });
  return url;
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(key: string) {
  return `${PUBLIC_URL}/${key}`;
}

/**
 * Generate a unique file key with timestamp
 */
export function generateFileKey(userId: string, fileName: string) {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${timestamp}-${sanitizedFileName}`;
}
