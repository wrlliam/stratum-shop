import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_MODEL_FILE_SIZE = 50 * 1024 * 1024 // 50MB for 3D models and digital files
const MAX_FILES = 10
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const ALLOWED_MODEL_TYPES = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
const ALLOWED_DIGITAL_EXTS = ['glb', 'gltf', 'pdf', 'zip', 'stl', 'step', 'obj', 'fbx', 'blend']
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_MODEL_TYPES, 'application/pdf', 'application/zip']

// Magic number signatures for image types
const IMAGE_SIGNATURES: [string, number[]][] = [
  ['image/jpeg', [0xFF, 0xD8, 0xFF]],
  ['image/png', [0x89, 0x50, 0x4E, 0x47]],
  ['image/gif', [0x47, 0x49, 0x46]],
  ['image/webp', [0x52, 0x49, 0x46, 0x46]], // RIFF header
  ['image/avif', [0x00, 0x00, 0x00]], // ftyp box (partial)
]

// GLB magic: 0x46546C67 (glTF)
const GLB_MAGIC = [0x67, 0x6C, 0x54, 0x46]

function isValidFile(buffer: Buffer, mimeType: string, filename: string): boolean {
  if (buffer.length < 4) return false

  // 3D model files
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'glb' || mimeType === 'model/gltf-binary') {
    return GLB_MAGIC.every((byte, i) => buffer[i] === byte)
  }
  if (ext === 'gltf' || mimeType === 'model/gltf+json') {
    // gltf files are JSON starting with '{'
    return buffer[0] === 0x7B
  }

  // Check magic number matches claimed image type
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
    const isDigital = formData.get('type') === 'digital'
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 })
    }

    const publicUploadDir = join(process.cwd(), 'public', 'uploads')
    const privateUploadDir = join(process.cwd(), 'private', 'digital')
    await Promise.all([
      mkdir(publicUploadDir, { recursive: true }),
      mkdir(privateUploadDir, { recursive: true }),
    ])

    const urls: string[] = []
    const paths: string[] = []

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      const isDigitalFile = isDigital || ALLOWED_DIGITAL_EXTS.includes(ext)
      const isImageFile = ALLOWED_IMAGE_TYPES.includes(file.type)

      // Allow images and digital file types
      if (!isImageFile && !isDigitalFile) continue

      const sizeLimit = isDigitalFile ? MAX_MODEL_FILE_SIZE : MAX_FILE_SIZE
      if (file.size > sizeLimit) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds ${sizeLimit / 1024 / 1024}MB limit` },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // For images, validate magic bytes
      if (isImageFile && !isValidFile(buffer, file.type, file.name)) continue

      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filename = `${timestamp}-${safeName}`

      if (isDigitalFile && !isImageFile) {
        // Store in private directory (not publicly accessible)
        await writeFile(join(privateUploadDir, filename), buffer)
        paths.push(filename)
      } else {
        await writeFile(join(publicUploadDir, filename), buffer)
        urls.push(`/uploads/${filename}`)
      }
    }

    return NextResponse.json({ urls, paths })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
