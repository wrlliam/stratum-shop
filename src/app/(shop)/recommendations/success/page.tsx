import Link from 'next/link'
import { CheckCircledIcon } from '@radix-ui/react-icons'

export default function RecommendationSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-6">
          <CheckCircledIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-brand-text mb-3">
          Thank You!
        </h1>
        <p className="text-brand-muted mb-2">
          Your payment has been received and your custom print is now in the queue.
        </p>
        <p className="text-brand-muted text-sm mb-8">
          We&apos;ll start printing your item shortly. You can track the progress
          from your orders page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center px-6 py-3 bg-brand-blue text-white font-semibold rounded-sm hover:bg-brand-blue-dark transition-colors"
          >
            View Your Orders
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-brand-arctic dark:bg-brand-surface text-brand-text font-semibold rounded-sm border border-brand-border hover:bg-brand-arctic/80 transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  )
}
