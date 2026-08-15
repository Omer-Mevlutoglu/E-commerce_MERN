// services/adminOrderService.ts
import { orderModel } from "../models/orderModel";

export interface PopulatedOrder {
  _id: string;
  orderItems: {
    productTitle: string;
    productImage: string;
    unitPrice: number;
    quantity: number;
  }[];
  total: number;
  address: string;
  fullName: string;
  payment: {
    method?: string;
    status?: string;
    last4?: string;
    brand?: string;
  };
  createdAt: Date;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export const getAllOrders = async (): Promise<PopulatedOrder[]> => {
  const raw = await orderModel
    .find()
    .populate("userId", "firstName lastName email")
    .sort({ createdAt: -1 })
    .lean();

  // Explicitly mapped rather than returned raw: this is the only listing that
  // exposes other people's orders, so the shape is a deliberate whitelist.
  return raw.map((order: any) => ({
    _id: order._id.toString(),
    orderItems: (order.orderItems ?? []).map((item: any) => ({
      productTitle: item.productTitle,
      productImage: item.productImage,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
    total: order.total,
    address: order.address,
    fullName: order.fullName,
    payment: {
      method: order.payment?.method,
      status: order.payment?.status,
      last4: order.payment?.last4,
      brand: order.payment?.brand,
    },
    createdAt: order.createdAt,
    // A deleted customer leaves the populate as null; previously this threw
    // and took the whole admin orders page down with a 500.
    userId: order.userId
      ? {
          _id: order.userId._id.toString(),
          firstName: order.userId.firstName,
          lastName: order.userId.lastName,
          email: order.userId.email,
        }
      : null,
  }));
};
