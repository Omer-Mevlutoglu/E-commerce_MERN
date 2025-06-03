// services/adminOrderService.ts
import { orderModel } from "../models/orderModel";

export interface PopulatedOrder {
  _id: string;         // keep as string
  orderItems: {
    productTtile: string;
    productImage: string;
    unitprice: number;
    quantity: number;
  }[];
  total: number;
  address: string;
  fullName: string;
  userId: {
    _id: string;       // also a string
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const getAllOrders = async (): Promise<PopulatedOrder[]> => {
  // 1) Fetch raw documents (with ObjectId fields)
  const raw = await orderModel
    .find()
    .populate("userId", "firstName lastName email")
    .lean();

  // 2) Map and convert every _id (and userId._id) to string
  const formatted: PopulatedOrder[] = raw.map((order: any) => ({
    _id: order._id.toString(),
    orderItems: order.orderItems.map((item: any) => ({
      productTtile: item.productTtile,
      productImage: item.productImage,
      unitprice: item.unitprice,
      quantity: item.quantity,
    })),
    total: order.total,
    address: order.address,
    fullName: order.fullName,
    userId: {
      _id: (order.userId._id as any).toString(),
      firstName: order.userId.firstName,
      lastName: order.userId.lastName,
      email: order.userId.email,
    },
  }));

  return formatted;
};
