import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL } from "@/lib/utils";

const VARIANT = { PENDING: "warning", PAID: "default", SHIPPED: "accent", DELIVERED: "success", CANCELLED: "muted" } as const;

export function OrderStatusBadge({ status }: { status: keyof typeof VARIANT }) {
  return <Badge variant={VARIANT[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}
