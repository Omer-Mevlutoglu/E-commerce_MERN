import mongoose, { Document, ObjectId, Schema } from "mongoose";

export interface IorderItem {
  productTtile: string;
  productImage: string;
  unitprice: number;
  quantity: number;
}

export interface Iorder extends Document {
  orderItems: IorderItem[];
  total: number;
  address: string;
  userId: ObjectId | string;
}

const IorderItemSchema = new Schema<IorderItem>({
  productTtile: { type: String, required: true },
  productImage: { type: String, required: true },
  unitprice: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const orderSchema = new Schema<Iorder>({
  orderItems: [IorderItemSchema],
  total: { type: Number, required: true },
  address: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Store reference to a user
    ref: "users", // Refers to the users collection
    required: true,
  },
});

export const orderModel = mongoose.model<Iorder>("orders", orderSchema);
