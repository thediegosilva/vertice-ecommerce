import { ProductGridSkeleton } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container py-10 md:py-14">
      <Skeleton className="mb-4 h-3 w-32" />
      <Skeleton className="mb-8 h-14 w-72" />
      <Skeleton className="mb-8 h-12 w-full" />
      <ProductGridSkeleton count={6} />
    </div>
  );
}
