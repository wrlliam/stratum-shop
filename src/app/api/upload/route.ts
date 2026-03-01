import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 10
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

// Magic number signatures for image types
const IMAGE_SIGNATURES: [string, number[]][] = [
  ['image/jpeg', [0xFF, 0xD8, 0xFF]],
  ['image/png', [0x89, 0x50, 0x4E, 0x47]],
  ['image/gif', [0x47, 0x49, 0x46]],
  ['image/webp', [0x52, 0x49, 0x46, 0x46]], // RIFF header
  ['image/avif', [0x00, 0x00, 0x00]], // ftyp box (partial)
]

function isValidImage(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false

  // Check magic number matches claimed type
  for (const [type, sig] of IMAGE_SIGNATURES) {
    if (mimeType === type) {
      return sig.every((byte, i) => buffer[i] === byte)
    }
  }
  return false
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 })
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const urls: string[] = []

    for (const file of files) {
      // Validate MIME type
      if (!ALLOWED_TYPES.includes(file.type)) {
        continue
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Validate magic number matches MIME type
      if (!isValidImage(buffer, file.type)) {
        continue
      }

      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filename = `${timestamp}-${safeName}`
      const filepath = join(uploadDir, filename)

      await writeFile(filepath, buffer)
      urls.push(`/uploads/${filename}`)
    }

    return NextResponse.json({ urls })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
