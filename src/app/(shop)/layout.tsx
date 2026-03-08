import { PageTransition } from '@/components/ui/PageTransition'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
