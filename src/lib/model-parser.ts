/**
 * Client-side parser for STL and 3MF files.
 * Extracts model volume (cm³) from uploaded 3D files.
 * Supports multi-object 3MF files with per-object breakdown.
 */
import { unzipSync } from 'fflate'

export interface ModelInfo {
  volumeCm3: number
  triangleCount: number
  boundingBox: { x: number; y: number; z: number } // mm
}

export interface ModelObject {
  id: string
  name: string
  volumeCm3: number
  triangleCount: number
  boundingBox: { x: number; y: number; z: number }
}

export interface ModelParseResult {
  volumeCm3: number
  triangleCount: number
  boundingBox: { x: number; y: number; z: number }
  objects: ModelObject[]
}

/**
 * Parse a 3D file (STL or 3MF) and return model info.
 */
export async function parseModelFile(file: File): Promise<ModelParseResult> {
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

function parseSTL(data: Uint8Array): ModelParseResult {
  // Check if ASCII or binary
  const header = new TextDecoder().decode(data.slice(0, 80))
  if (header.trimStart().startsWith('solid') && !isBinarySTL(data)) {
    return parseSTLAscii(data)
  }
  return parseSTLBinary(data)
}

function isBinarySTL(data: Uint8Array): boolean {
  if (data.length < 84) return false
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const triCount = view.getUint32(80, true)
  return data.length === 84 + triCount * 50
}

function parseSTLBinary(data: Uint8Array): ModelParseResult {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const triangleCount = view.getUint32(80, true)

  let volume = 0
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  for (let i = 0; i < triangleCount; i++) {
    const offset = 84 + i * 50
    const v1x = view.getFloat32(offset + 12, true)
    const v1y = view.getFloat32(offset + 16, true)
    const v1z = view.getFloat32(offset + 20, true)
    const v2x = view.getFloat32(offset + 24, true)
    const v2y = view.getFloat32(offset + 28, true)
    const v2z = view.getFloat32(offset + 32, true)
    const v3x = view.getFloat32(offset + 36, true)
    const v3y = view.getFloat32(offset + 40, true)
    const v3z = view.getFloat32(offset + 44, true)

    volume += signedTetraVolume(v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z)

    minX = Math.min(minX, v1x, v2x, v3x)
    minY = Math.min(minY, v1y, v2y, v3y)
    minZ = Math.min(minZ, v1z, v2z, v3z)
    maxX = Math.max(maxX, v1x, v2x, v3x)
    maxY = Math.max(maxY, v1y, v2y, v3y)
    maxZ = Math.max(maxZ, v1z, v2z, v3z)
  }

  const volumeMm3 = Math.abs(volume)
  const volumeCm3 = Math.round((volumeMm3 / 1000) * 100) / 100
  const boundingBox = {
    x: Math.round((maxX - minX) * 100) / 100,
    y: Math.round((maxY - minY) * 100) / 100,
    z: Math.round((maxZ - minZ) * 100) / 100,
  }

  return {
    volumeCm3,
    triangleCount,
    boundingBox,
    objects: [{ id: '1', name: 'Model', volumeCm3, triangleCount, boundingBox }],
  }
}

function parseSTLAscii(data: Uint8Array): ModelParseResult {
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
  const volumeCm3 = Math.round((volumeMm3 / 1000) * 100) / 100
  const boundingBox = {
    x: Math.round((maxX - minX) * 100) / 100,
    y: Math.round((maxY - minY) * 100) / 100,
    z: Math.round((maxZ - minZ) * 100) / 100,
  }

  return {
    volumeCm3,
    triangleCount,
    boundingBox,
    objects: [{ id: '1', name: 'Model', volumeCm3, triangleCount, boundingBox }],
  }
}

// ─── 3MF Parser ──────────────────────────────────────────────────────────────

interface MeshData {
  volume: number
  triangleCount: number
  minX: number; minY: number; minZ: number
  maxX: number; maxY: number; maxZ: number
}

function parseMeshFromXml(meshXml: string): MeshData {
  const verticesMatch = meshXml.match(/<vertices>([\s\S]*?)<\/vertices>/i)
  if (!verticesMatch) return { volume: 0, triangleCount: 0, minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 }

  const vertexRegex = /<vertex\s+x="([^"]+)"\s+y="([^"]+)"\s+z="([^"]+)"/g
  const verts: [number, number, number][] = []
  let vMatch
  while ((vMatch = vertexRegex.exec(verticesMatch[1]))) {
    verts.push([parseFloat(vMatch[1]), parseFloat(vMatch[2]), parseFloat(vMatch[3])])
  }

  const trianglesMatch = meshXml.match(/<triangles>([\s\S]*?)<\/triangles>/i)
  if (!trianglesMatch) return { volume: 0, triangleCount: 0, minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 }

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

  return { volume, triangleCount, minX, minY, minZ, maxX, maxY, maxZ }
}

function parse3MF(data: Uint8Array): ModelParseResult {
  const files = unzipSync(data)

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

  // Parse all <object> elements
  const objectRegex = /<object\s+[^>]*?id="(\d+)"[^>]*?>([\s\S]*?)<\/object>/gi
  const rawObjects: { id: string; name: string; meshXml: string }[] = []
  let oMatch
  while ((oMatch = objectRegex.exec(modelXml))) {
    const objTag = oMatch[0]
    const id = oMatch[1]
    const nameMatch = objTag.match(/name="([^"]*)"/)
    const name = nameMatch ? nameMatch[1] : `Part ${id}`
    const meshMatch = oMatch[2].match(/<mesh>([\s\S]*?)<\/mesh>/i)
    if (meshMatch) {
      rawObjects.push({ id, name, meshXml: meshMatch[0] })
    }
  }

  if (rawObjects.length === 0) {
    throw new Error('No mesh objects found in 3MF model')
  }

  // Check <build> section for which objects are actually used
  const buildMatch = modelXml.match(/<build>([\s\S]*?)<\/build>/i)
  let builtIds: Set<string> | null = null
  if (buildMatch) {
    builtIds = new Set<string>()
    const itemRegex = /objectid="(\d+)"/g
    let iMatch
    while ((iMatch = itemRegex.exec(buildMatch[1]))) {
      builtIds.add(iMatch[1])
    }
  }

  // Filter to built objects (or all if no build section)
  const objectsToInclude = builtIds
    ? rawObjects.filter((o) => builtIds!.has(o.id))
    : rawObjects

  if (objectsToInclude.length === 0) {
    throw new Error('No buildable objects found in 3MF model')
  }

  // Parse each object's mesh
  const objects: ModelObject[] = objectsToInclude.map((obj) => {
    const mesh = parseMeshFromXml(obj.meshXml)
    const volumeMm3 = Math.abs(mesh.volume)
    const volumeCm3 = Math.round((volumeMm3 / 1000) * 100) / 100
    return {
      id: obj.id,
      name: obj.name,
      volumeCm3,
      triangleCount: mesh.triangleCount,
      boundingBox: {
        x: Math.round((mesh.maxX - mesh.minX) * 100) / 100,
        y: Math.round((mesh.maxY - mesh.minY) * 100) / 100,
        z: Math.round((mesh.maxZ - mesh.minZ) * 100) / 100,
      },
    }
  })

  // Compute aggregates
  const totalVolume = Math.round(objects.reduce((s, o) => s + o.volumeCm3, 0) * 100) / 100
  const totalTriangles = objects.reduce((s, o) => s + o.triangleCount, 0)

  // Union bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (const obj of objectsToInclude) {
    const mesh = parseMeshFromXml(obj.meshXml)
    if (mesh.triangleCount > 0) {
      minX = Math.min(minX, mesh.minX)
      minY = Math.min(minY, mesh.minY)
      minZ = Math.min(minZ, mesh.minZ)
      maxX = Math.max(maxX, mesh.maxX)
      maxY = Math.max(maxY, mesh.maxY)
      maxZ = Math.max(maxZ, mesh.maxZ)
    }
  }

  return {
    volumeCm3: totalVolume,
    triangleCount: totalTriangles,
    boundingBox: {
      x: Math.round((maxX - minX) * 100) / 100,
      y: Math.round((maxY - minY) * 100) / 100,
      z: Math.round((maxZ - minZ) * 100) / 100,
    },
    objects,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signedTetraVolume(
  v1x: number, v1y: number, v1z: number,
  v2x: number, v2y: number, v2z: number,
  v3x: number, v3y: number, v3z: number,
): number {
  return (
    v1x * (v2y * v3z - v2z * v3y) +
    v1y * (v2z * v3x - v2x * v3z) +
    v1z * (v2x * v3y - v2y * v3x)
  ) / 6
}
