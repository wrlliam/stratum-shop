export default function OrdersLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="skeleton h-3 w-16 mb-3" />
          <div className="skeleton h-8 w-32" />
        </div>

        {/* Order cards */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Order header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
                <div className="flex items-center gap-4">
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-5 w-20 rounded-full" />
                </div>
                <div className="skeleton h-4 w-20" />
              </div>

              {/* Items */}
              <div className="p-5 flex items-center gap-4">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="skeleton h-14 w-14 rounded-lg flex-shrink-0" />
                ))}
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
                <div className="skeleton h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
