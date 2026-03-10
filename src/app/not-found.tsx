import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-brand-blue mb-4">404</p>
        <h1 className="text-2xl font-bold text-brand-text mb-3">Page not found</h1>
        <p className="text-brand-muted mb-8 text-sm leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-brand-blue text-white text-sm font-semibold rounded-xl hover:bg-brand-blue/90 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/products"
            className="px-6 py-2.5 border border-brand-border text-brand-text text-sm font-semibold rounded-xl hover:bg-brand-arctic transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  )
}
