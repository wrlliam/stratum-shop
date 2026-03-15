export const dynamic = "force-dynamic";

import { db, bundles, productImages } from "@/lib/db";
import { eq, desc, asc } from "drizzle-orm";
import { BundleCard } from "@/components/shop/BundleCard";
import type { BundleWithProducts } from "@/types";
import { CubeIcon } from "@radix-ui/react-icons";

async function getBundles(): Promise<BundleWithProducts[]> {
  return db.query.bundles.findMany({
    where: eq(bundles.active, true),
    with: {
      bundleProducts: {
        with: {
          product: { with: { images: { orderBy: asc(productImages.order) } } },
        },
      },
    },
    orderBy: desc(bundles.createdAt),
  }) as Promise<BundleWithProducts[]>;
}

export const metadata = {
  title: "Bundle Deals",
  description:
    "Get multiple 3D prints at a discounted price with our bundle deals.",
};

export default async function BundlesPage() {
  const allBundles = await getBundles();

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-2">
            Save more
          </p>
          <h1 className="text-4xl font-display text-brand-text">Bundle Deals</h1>
          <p className="text-brand-muted mt-3 max-w-xl">
            Get more for less. Our bundles group complementary prints together
            at a discounted price — perfect if you know what you need.
          </p>
        </div>

        {allBundles.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-sm bg-brand-arctic border border-brand-border flex items-center justify-center mx-auto mb-4">
              <CubeIcon className="w-7 h-7 text-brand-muted" />
            </div>
            <h3 className="text-lg font-semibold text-brand-text mb-2">
              No bundles yet
            </h3>
            <p className="text-brand-muted text-sm">
              Check back soon for bundle deals.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBundles.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
