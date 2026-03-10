'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, useGLTF } from '@react-three/drei'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

interface ModelViewerProps {
  url: string
  height?: number
}

export function ModelViewer({ url, height = 400 }: ModelViewerProps) {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-brand-border bg-brand-arctic"
      style={{ height }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} shadows>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Model url={url} />
          </Stage>
          <OrbitControls
            enablePan={false}
            enableZoom
            minDistance={1}
            maxDistance={20}
            autoRotate
            autoRotateSpeed={1.5}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
