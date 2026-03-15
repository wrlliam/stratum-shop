export default function CartLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="skeleton h-3 w-16 mb-3" />
          <div className="skeleton h-8 w-24" />
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-sm border border-brand-border bg-brand-surface"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="skeleton h-20 w-20 rounded-sm flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-2/3" />
                  <div className="skeleton h-3 w-1/3" />
                  <div className="flex items-center gap-3 pt-1">
                    <div className="skeleton h-8 w-24 rounded-sm" />
                    <div className="skeleton h-4 w-16" />
                  </div>
                </div>
                <div className="skeleton h-5 w-16" />
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 lg:mt-0">
            <div className="rounded-sm border border-brand-border bg-brand-surface p-6 sticky top-24 space-y-4">
              <div className="skeleton h-5 w-36" />
              <div className="space-y-2 py-2">
                <div className="flex justify-between">
                  <div className="skeleton h-3 w-20" />
                  <div className="skeleton h-3 w-16" />
                </div>
                <div className="flex justify-between">
                  <div className="skeleton h-3 w-16" />
                  <div className="skeleton h-3 w-12" />
                </div>
              </div>
              <div className="border-t border-brand-border pt-4 flex justify-between">
                <div className="skeleton h-5 w-12" />
                <div className="skeleton h-5 w-20" />
              </div>
              <div className="skeleton h-12 w-full rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
