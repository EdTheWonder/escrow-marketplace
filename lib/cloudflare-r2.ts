import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ENDPOINT) {
  throw new Error('Missing R2 credentials in environment variables');
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true // Required for R2
});

export async function uploadToR2(file: File): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: 'buyby',
        Key: fileName,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
      })
    );

    return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error('Failed to upload file to R2');
  }
}

export async function deleteFromR2(url: string) {
  try {
    const fileName = url.split('/').pop();
    if (!fileName) return;

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: 'buyby',
        Key: fileName,
      })
    );
  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error('Failed to delete file from R2');
  }
}
