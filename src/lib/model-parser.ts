/**
 * Client-side parser for STL and 3MF files.
 * Extracts model volume (cm³) from uploaded 3D files.
 */
import { unzipSync } from 'fflate'

export interface ModelInfo {
  volumeCm3: number
  triangleCount: number
  boundingBox: { x: number; y: number; z: number } // mm
}

/**
 * Parse a 3D file (STL or 3MF) and return model info.
 */
export async function parseModelFile(file: File): Promise<ModelInfo> {
  const buffer = await file.arrayBuffer()
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === '3mf') {
    return parse3MF(new Uint8Array(buffer))
  } else if (ext === 'stl') {
    return parseSTL(new Uint8Array(buffer))
  }

  throw new Error(`Unsupported file type: .${ext}`)
}

// ─── STL Parser ──────────────────────────────────────────────────────────────

function parseSTL(data: Uint8Array): ModelInfo {
  // Check if ASCII or binary
  const header = new TextDecoder().decode(data.slice(0, 80))
  if (header.trimStart().startsWith('solid') && !isBinarySTL(data)) {
    return parseSTLAscii(data)
  }
  return parseSTLBinary(data)
}

function isBinarySTL(data: Uint8Array): boolean {
  // Binary STL: 80-byte header + 4-byte triangle count
  // If the file is exactly 80 + 4 + (50 * triangleCount), it's binary
  if (data.length < 84) return false
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const triCount = view.getUint32(80, true)
  return data.length === 84 + triCount * 50
}

function parseSTLBinary(data: Uint8Array): ModelInfo {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const triangleCount = view.getUint32(80, true)

  let volume = 0
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  for (let i = 0; i < triangleCount; i++) {
    const offset = 84 + i * 50
    // Skip normal (12 bytes), read 3 vertices (each 12 bytes = 3 floats)
    const v1x = view.getFloat32(offset + 12, true)
    const v1y = view.getFloat32(offset + 16, true)
    const v1z = view.getFloat32(offset + 20, true)
    const v2x = view.getFloat32(offset + 24, true)
    const v2y = view.getFloat32(offset + 28, true)
    const v2z = view.getFloat32(offset + 32, true)
    const v3x = view.getFloat32(offset + 36, true)
    const v3y = view.getFloat32(offset + 40, true)
    const v3z = view.getFloat32(offset + 44, true)

    // Signed volume of tetrahedron with origin
    volume += signedTetraVolume(v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z)

    // Bounding box
    minX = Math.min(minX, v1x, v2x, v3x)
    minY = Math.min(minY, v1y, v2y, v3y)
    minZ = Math.min(minZ, v1z, v2z, v3z)
    maxX = Math.max(maxX, v1x, v2x, v3x)
    maxY = Math.max(maxY, v1y, v2y, v3y)
    maxZ = Math.max(maxZ, v1z, v2z, v3z)
  }

  // Volume in mm³ → cm³ (divide by 1000)
  const volumeMm3 = Math.abs(volume)
  const volumeCm3 = volumeMm3 / 1000

  return {
    volumeCm3: Math.round(volumeCm3 * 100) / 100,
    triangleCount,
    boundingBox: {
      x: Math.round((maxX - minX) * 100) / 100,
      y: Math.round((maxY - minY) * 100) / 100,
      z: Math.round((maxZ - minZ) * 100) / 100,
    },
  }
}

function parseSTLAscii(data: Uint8Array): ModelInfo {
  const text = new TextDecoder().decode(data)
  const vertexRegex = /vertex\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/g

  const vertices: [number, number, number][] = []
  let match
  while ((match = vertexRegex.exec(text))) {
    vertices.push([parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])])
  }

  let volume = 0
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  const triangleCount = Math.floor(vertices.length / 3)

  for (let i = 0; i < vertices.length; i += 3) {
    const [v1x, v1y, v1z] = vertices[i]
    const [v2x, v2y, v2z] = vertices[i + 1]
    const [v3x, v3y, v3z] = vertices[i + 2]

    volume += signedTetraVolume(v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z)

    minX = Math.min(minX, v1x, v2x, v3x)
    minY = Math.min(minY, v1y, v2y, v3y)
    minZ = Math.min(minZ, v1z, v2z, v3z)
    maxX = Math.max(maxX, v1x, v2x, v3x)
    maxY = Math.max(maxY, v1y, v2y, v3y)
    maxZ = Math.max(maxZ, v1z, v2z, v3z)
  }

  const volumeMm3 = Math.abs(volume)
  const volumeCm3 = volumeMm3 / 1000

  return {
    volumeCm3: Math.round(volumeCm3 * 100) / 100,
    triangleCount,
    boundingBox: {
      x: Math.round((maxX - minX) * 100) / 100,
      y: Math.round((maxY - minY) * 100) / 100,
      z: Math.round((maxZ - minZ) * 100) / 100,
    },
  }
}

// ─── 3MF Parser ──────────────────────────────────────────────────────────────

function parse3MF(data: Uint8Array): ModelInfo {
  const files = unzipSync(data)

  // Find the model file (usually 3D/3dmodel.model)
  let modelXml: string | null = null
  for (const [name, content] of Object.entries(files)) {
    if (name.toLowerCase().endsWith('.model')) {
      modelXml = new TextDecoder().decode(content)
      break
    }
  }

  if (!modelXml) {
    throw new Error('No model file found in 3MF archive')
  }

  // Parse vertices
  const verticesMatch = modelXml.match(/<vertices>([\s\S]*?)<\/vertices>/i)
  if (!verticesMatch) throw new Error('No vertices found in 3MF model')

  const vertexRegex = /<vertex\s+x="([^"]+)"\s+y="([^"]+)"\s+z="([^"]+)"/g
  const verts: [number, number, number][] = []
  let vMatch
  while ((vMatch = vertexRegex.exec(verticesMatch[1]))) {
    verts.push([parseFloat(vMatch[1]), parseFloat(vMatch[2]), parseFloat(vMatch[3])])
  }

  // Parse triangles
  const trianglesMatch = modelXml.match(/<triangles>([\s\S]*?)<\/triangles>/i)
  if (!trianglesMatch) throw new Error('No triangles found in 3MF model')

  const triRegex = /<triangle\s+v1="(\d+)"\s+v2="(\d+)"\s+v3="(\d+)"/g
  let volume = 0
  let triangleCount = 0
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  let tMatch
  while ((tMatch = triRegex.exec(trianglesMatch[1]))) {
    const i1 = parseInt(tMatch[1])
    const i2 = parseInt(tMatch[2])
    const i3 = parseInt(tMatch[3])

    const [v1x, v1y, v1z] = verts[i1]
    const [v2x, v2y, v2z] = verts[i2]
    const [v3x, v3y, v3z] = verts[i3]

    volume += signedTetraVolume(v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z)

    minX = Math.min(minX, v1x, v2x, v3x)
    minY = Math.min(minY, v1y, v2y, v3y)
    minZ = Math.min(minZ, v1z, v2z, v3z)
    maxX = Math.max(maxX, v1x, v2x, v3x)
    maxY = Math.max(maxY, v1y, v2y, v3y)
    maxZ = Math.max(maxZ, v1z, v2z, v3z)
    triangleCount++
  }

  // 3MF uses millimetres by default
  const volumeMm3 = Math.abs(volume)
  const volumeCm3 = volumeMm3 / 1000

  return {
    volumeCm3: Math.round(volumeCm3 * 100) / 100,
    triangleCount,
    boundingBox: {
      x: Math.round((maxX - minX) * 100) / 100,
      y: Math.round((maxY - minY) * 100) / 100,
      z: Math.round((maxZ - minZ) * 100) / 100,
    },
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Signed volume of a tetrahedron formed by a triangle and the origin.
 * Sum over all triangles gives the total signed volume of the mesh.
 */
function signedTetraVolume(
  v1x: number, v1y: number, v1z: number,
  v2x: number, v2y: number, v2z: number,
  v3x: number, v3y: number, v3z: number,
): number {
  // V = v1 · (v2 × v3) / 6
  return (
    v1x * (v2y * v3z - v2z * v3y) +
    v1y * (v2z * v3x - v2x * v3z) +
    v1z * (v2x * v3y - v2y * v3x)
  ) / 6
}
