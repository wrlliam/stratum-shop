import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { s3, MINIO_BUCKET } from '@/lib/minio'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  // Only allow safe filenames (alphanumeric, hyphens, underscores, dots)
  if (!/^[\w.-]+$/.test(name)) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const command = new GetObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: `support/${name}`,
    })
    const obj = await s3.send(command)
    const bytes = await obj.Body?.transformToByteArray()
    if (!bytes) return new NextResponse(null, { status: 404 })

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': obj.ContentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
