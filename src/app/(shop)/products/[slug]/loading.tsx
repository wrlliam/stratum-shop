export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen pt-20 pb-16 bg-brand-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 pt-4">
          <div className="skeleton h-3 w-12" />
          <span className="text-brand-border">/</span>
          <div className="skeleton h-3 w-24" />
          <span className="text-brand-border">/</span>
          <div className="skeleton h-3 w-32" />
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-16">
          {/* Image carousel skeleton */}
          <div className="space-y-3 mb-10 lg:mb-0">
            <div className="skeleton rounded-lg aspect-square w-full" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton rounded-lg w-20 h-20 flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div className="space-y-5">
            {/* Badge + title */}
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-9 w-3/4" />
            <div className="space-y-2">
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-5/6" />
              <div className="skeleton h-3 w-2/3" />
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 pt-2">
              <div className="skeleton h-8 w-24" />
              <div className="skeleton h-5 w-16" />
            </div>

            {/* Options */}
            <div className="border-t border-brand-border pt-5 space-y-4">
              <div className="skeleton h-3 w-20" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-9 w-20 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Add to cart button */}
            <div className="skeleton h-13 w-full rounded-lg" />

            {/* Spec cards */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-lg border border-brand-border p-3 space-y-2">
                  <div className="skeleton h-3 w-3/4 mx-auto" />
                  <div className="skeleton h-4 w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
