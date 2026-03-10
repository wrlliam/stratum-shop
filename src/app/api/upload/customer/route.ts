import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { putObject, objectUrl, ensureBucket } from '@/lib/minio'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to upload files' }, { status: 401 })
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

    const objectName = `${session.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const buffer = Buffer.from(await file.arrayBuffer())

    await putObject(objectName, buffer, file.type, { 'uploaded-by': session.user.id })

    return NextResponse.json({ url: objectUrl(objectName) })
  } catch (error) {
    console.error('Customer upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
