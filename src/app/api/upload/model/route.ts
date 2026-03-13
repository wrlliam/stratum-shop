import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_EXTENSIONS = ['stl', '3mf']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: 'Only STL and 3MF files are accepted' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 50MB limit' }, { status: 400 })
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'models')
    await mkdir(uploadDir, { recursive: true })

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${safeName}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Basic validation: STL files should start with "solid" (ASCII) or have correct size (binary)
    // 3MF files should start with PK (ZIP magic)
    if (ext === '3mf') {
      if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
        return NextResponse.json({ error: 'Invalid 3MF file' }, { status: 400 })
      }
    }

    await writeFile(join(uploadDir, filename), buffer)
    const url = `/uploads/models/${filename}`

    return NextResponse.json({ url, filename })
  } catch (error) {
    console.error('Model upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
