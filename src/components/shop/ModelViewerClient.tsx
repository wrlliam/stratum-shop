'use client'

import dynamic from 'next/dynamic'

const ModelViewer = dynamic(
  () => import('@/components/shop/ModelViewer').then((m) => m.ModelViewer),
  { ssr: false, loading: () => (
    <div className="w-full rounded-2xl border border-brand-border bg-brand-arctic flex items-center justify-center" style={{ height: 400 }}>
      <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
    </div>
  )}
)

export function ModelViewerClient({ url }: { url: string }) {
  return <ModelViewer url={url} />
}
