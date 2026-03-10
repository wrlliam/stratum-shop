export const dynamic = "force-dynamic";

import { db, products, productImages, bundles, orderItems } from "@/lib/db";
import { eq, desc, asc, sql } from "drizzle-orm";
import { HeroSection } from "@/components/home/HeroSection";
import {
  ValueProps,
  FeaturedProducts,
  ProcessSection,
  MaterialsSection,
  BundleSection,
  ShippingSection,
  FAQSection,
  CTASection,
} from "@/components/home/AnimatedSections";
import type { BundleWithProducts, ProductWithImages } from "@/types";

async function getFeaturedProducts(): Promise<ProductWithImages[]> {
  return db.query.products.findMany({
    where: eq(products.featured, true),
    with: { images: { orderBy: asc(productImages.order) } },
    limit: 8,
    orderBy: desc(products.createdAt),
  });
}

async function getLatestProducts(): Promise<ProductWithImages[]> {
  return db.query.products.findMany({
    where: eq(products.active, true),
    with: { images: { orderBy: asc(productImages.order) } },
    limit: 8,
    orderBy: desc(products.createdAt),
  });
}

async function getBestSellingProducts(): Promise<ProductWithImages[]> {
  // Get product IDs sorted by total quantity sold
  const bestSelling = await db
    .select({
      productId: orderItems.productId,
      totalSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`.as(
        "total_sold",
      ),
    })
    .from(orderItems)
    .where(sql`${orderItems.productId} IS NOT NULL`)
    .groupBy(orderItems.productId)
    .orderBy(desc(sql`total_sold`))
    .limit(8);

  if (bestSelling.length === 0) return [];

  const productIds = bestSelling
    .map((b) => b.productId)
    .filter(Boolean) as string[];

  const result = await db.query.products.findMany({
    where: sql`${products.id} IN (${sql.join(
      productIds.map((id) => sql`${id}`),
      sql`, `,
    )}) AND ${products.active} = true`,
    with: { images: { orderBy: asc(productImages.order) } },
  });

  // Sort by sales order
  return productIds
    .map((id) => result.find((p) => p.id === id))
    .filter(Boolean) as ProductWithImages[];
}

async function getActiveBundles(): Promise<BundleWithProducts[]> {
  return db.query.bundles.findMany({
    where: eq(bundles.active, true),
    with: {
      bundleProducts: {
        with: {
          product: { with: { images: { orderBy: asc(productImages.order) } } },
        },
      },
    },
    limit: 3,
    orderBy: desc(bundles.createdAt),
  }) as Promise<BundleWithProducts[]>;
}

export default async function HomePage() {
  const [featuredProducts, latestProducts, bestSellingProducts, activeBundles] =
    await Promise.all([
      getFeaturedProducts(),
      getLatestProducts(),
      getBestSellingProducts(),
      getActiveBundles(),
    ]);

  const displayProducts =
    featuredProducts.length > 0
      ? featuredProducts
      : bestSellingProducts.length > 0
        ? bestSellingProducts
        : latestProducts;

  return (
    <>
      <HeroSection />
      <ValueProps />
      <FeaturedProducts
        featuredProducts={featuredProducts}
        displayProducts={displayProducts}
      />
      <ProcessSection />
      <BundleSection activeBundles={activeBundles} />
      <MaterialsSection />
      <ShippingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
