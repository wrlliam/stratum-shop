export default function ProductsLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-brand-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="skeleton h-3 w-24 mb-3" />
          <div className="skeleton h-8 w-48" />
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-8">
          <div className="skeleton h-9 w-28 rounded-sm" />
          <div className="skeleton h-9 w-32 rounded-sm" />
          <div className="ml-auto skeleton h-9 w-36 rounded-sm" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-sm bg-brand-surface border border-brand-border overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="skeleton aspect-square" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-3 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="flex items-center justify-between pt-1">
                  <div className="skeleton h-4 w-16" />
                  <div className="skeleton h-3 w-10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
