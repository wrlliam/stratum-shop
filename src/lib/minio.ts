import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3'

export const s3 = new S3Client({
  endpoint: `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`,
  region: 'us-east-1', // Required by SDK, ignored by MinIO
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'stratum',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'stratum_minio_pass',
  },
  forcePathStyle: true, // Required for MinIO
})

export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'stratum-custom-orders'
export const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'

const PUBLIC_POLICY = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
    },
  ],
})

/** Ensure bucket exists and is publicly readable. Safe to call on every upload. */
export async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }))
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }))
  }
  // Always apply public read policy (idempotent)
  await s3.send(new PutBucketPolicyCommand({ Bucket: MINIO_BUCKET, Policy: PUBLIC_POLICY }))
}

export async function putObject(objectName: string, buffer: Buffer, contentType: string, metadata?: Record<string, string>) {
  await s3.send(
    new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: objectName,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
    })
  )
}

export function objectUrl(objectName: string): string {
  return `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${objectName}`
}
