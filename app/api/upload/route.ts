import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { uploadToR2, generateUniqueFilename } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const providedName = formData.get('filename');

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
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
