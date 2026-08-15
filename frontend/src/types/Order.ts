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

export interface Order {
  _id: string;
  orderItems: OrderItem[];
  total: number;
  address: string;
  fullName: string;
  payment?: Payment;
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
