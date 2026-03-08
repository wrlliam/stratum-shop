export default function CheckoutLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="skeleton h-6 w-6 rounded" />
          <div className="skeleton h-7 w-32" />
        </div>

        <div className="lg:grid lg:grid-cols-5 lg:gap-12">
          {/* Left — form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Email */}
            <div className="rounded-lg border border-brand-border bg-brand-surface p-6 space-y-4">
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>

            {/* Address */}
            <div className="rounded-lg border border-brand-border bg-brand-surface p-6 space-y-4">
              <div className="skeleton h-5 w-40" />
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`skeleton h-10 rounded-lg ${i === 0 ? 'col-span-2' : ''}`} />
                ))}
              </div>
            </div>

            {/* Delivery options */}
            <div className="rounded-lg border border-brand-border bg-brand-surface p-6 space-y-3">
              <div className="skeleton h-5 w-36" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-4 w-4 rounded-full" />
                    <div className="skeleton h-4 w-36" />
                  </div>
                  <div className="skeleton h-4 w-12" />
                </div>
              ))}
            </div>
          </div>

          {/* Right — order summary */}
          <div className="lg:col-span-2 mt-8 lg:mt-0">
            <div className="rounded-lg border border-brand-border bg-brand-surface p-6 sticky top-24 space-y-4">
              <div className="skeleton h-5 w-36" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton h-14 w-14 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                  <div className="skeleton h-4 w-14" />
                </div>
              ))}
              <div className="border-t border-brand-border pt-4 space-y-2">
                <div className="flex justify-between">
                  <div className="skeleton h-3 w-20" />
                  <div className="skeleton h-3 w-16" />
                </div>
                <div className="flex justify-between">
                  <div className="skeleton h-3 w-16" />
                  <div className="skeleton h-3 w-12" />
                </div>
                <div className="flex justify-between pt-1">
                  <div className="skeleton h-5 w-12" />
                  <div className="skeleton h-5 w-20" />
                </div>
              </div>
              <div className="skeleton h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
