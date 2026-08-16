export interface OrderItem {
  productTitle: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
}

export interface Payment {
  method?: string;
  status?: string;
  last4?: string;
  brand?: string;
}

export const ORDER_STATUSES = [
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** MUI Chip colours for each stage of the lifecycle. */
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: "info" | "primary" | "success" | "error" }
> = {
  processing: { label: "Processing", color: "info" },
  shipped: { label: "Shipped", color: "primary" },
  delivered: { label: "Delivered", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
};

export interface Order {
  _id: string;
  orderItems: OrderItem[];
  total: number;
  address: string;
  fullName: string;
  payment?: Payment;
  status?: OrderStatus;
  createdAt?: string;
}

/** What the admin listing returns: an order plus its customer. */
export interface AdminOrder extends Order {
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}
