import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-guard'
import { readFile } from 'fs/promises'
import { join, resolve, basename } from 'path'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const filePath = request.nextUrl.searchParams.get('path')
  if (!filePath) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  // Only allow files from uploads/models directory
  const uploadsRoot = resolve(process.cwd(), 'public', 'uploads', 'models')
  const fullPath = resolve(join(process.cwd(), 'public', filePath))

  if (!fullPath.startsWith(uploadsRoot)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const buffer = await readFile(fullPath)
    const filename = basename(fullPath)
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'bin'

    const mimeType =
      ext === 'stl' ? 'model/stl'
      : ext === '3mf' ? 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml'
      : 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
