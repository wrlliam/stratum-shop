import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { putObject, ensureBucket } from '@/lib/minio'
import { nanoid } from 'nanoid'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in to upload images' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400 })
    }

    await ensureBucket()

    const ext = EXT_MAP[file.type] ?? 'jpg'
    const name = `${nanoid(32)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    await putObject(`support/${name}`, buffer, file.type, {
      'uploaded-by': session.user.id,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.json({ url: `${appUrl}/i/${name}`, name })
  } catch (error) {
    console.error('Support upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
