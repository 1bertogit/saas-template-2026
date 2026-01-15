import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { uploadToR2, generateUniqueFilename } from '@/lib/storage';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting - 10 uploads per minute
  const rateLimitResult = await rateLimit(userId, 'upload');
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many uploads. Please wait before uploading more files.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const providedName = formData.get('filename');

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  // File size limit (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 10MB.' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateUniqueFilename(providedName ? String(providedName) : file.name || 'upload.bin', userId);

  try {
    const url = await uploadToR2(key, buffer, file.type || 'application/octet-stream');
    return NextResponse.json({ key, url });
  } catch (error) {
    console.error('Upload error', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
