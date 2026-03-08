import { PageTransition } from '@/components/ui/PageTransition'

export default function ShopTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
