import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: 'buyby', // Add the bucket name here
      Key: fileName,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    })
  );

  return `https://pub-2127bf698dab4e5c8767c9f3a15d08d6.r2.dev/${fileName}`;
}

export async function deleteFromR2(url: string) {
  const fileName = url.split('/').pop();
  if (!fileName) return;

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: 'buyby', // Add the bucket name here
      Key: fileName,
    })
  );
}
