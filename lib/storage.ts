import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
  throw new Error('Cloudflare R2 environment variables are not set');
}

// Configure S3 client for Cloudflare R2
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: your R2 public domain

export interface UploadOptions {
  key: string;
  body: Buffer | Uint8Array | Blob | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * Upload a file to R2
 */
export async function uploadFile({ key, body, contentType, metadata }: UploadOptions) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body as any,
    ContentType: contentType,
    Metadata: metadata,
  });

  await r2.send(command);

  return {
    key,
    url: getPublicUrl(key),
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

  await r2.send(command);
}

/**
 * Get a signed URL for private file access (expires in 1 hour by default)
 */
export async function getSignedFileUrl(key: string, expiresIn: number = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(r2, command, { expiresIn });
}

/**
 * Get public URL for a file (if you have R2 public domain configured)
 */
export function getPublicUrl(key: string): string {
  if (PUBLIC_URL) {
    return `${PUBLIC_URL}/${key}`;
  }
  // Fallback to R2.dev subdomain (if enabled in your R2 bucket settings)
  return `https://${BUCKET_NAME}.r2.dev/${key}`;
}

/**
 * Generate a unique file key with timestamp
 */
export function generateFileKey(userId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${timestamp}-${sanitized}`;
}
