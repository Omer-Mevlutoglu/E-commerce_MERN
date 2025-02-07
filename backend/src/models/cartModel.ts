import mongoose, { Document, ObjectId, Schema } from "mongoose";
import { Iproduct } from "./productModel";

// Define possible status values for the cart
const cartStatusEnum = ["active", "completed"];

// Define the interface for a single cart item
export interface IcartItem {
  product: Iproduct; // Reference to the product model
  unitPrice: number; // Price per unit of the product
  quantity: number; // Quantity of the product in the cart
}

// Define the interface for the cart document
export interface Icart extends Document {
  userId: ObjectId | string; // Reference to the user who owns the cart
  items: IcartItem[]; // Array of items in the cart
  totalAmount: number; // Total cost of all items in the cart
  status: "active" | "completed"; // Cart status (active or completed)
}

// Define the schema for individual cart items
export const IcartItemSchema = new Schema<IcartItem>({
  product: {
    type: mongoose.Schema.Types.ObjectId, // Store reference to a product
    ref: "product", // Refers to the product collection
    required: true,
  },
  unitPrice: { type: Number, required: true }, // Ensure unit price is stored
  quantity: { type: Number, required: true }, // Ensure quantity is stored
});

// Define the schema for the cart
export const IcartSchema = new Schema<Icart>({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Store reference to a user
    ref: "users", // Refers to the users collection
    required: true,
  },
  items: [IcartItemSchema], // Array of cart items
  totalAmount: { type: Number, required: true }, // Total cost of cart
  status: { type: String, enum: cartStatusEnum, default: "active" }, // Restrict status to valid values
});

// Create and export the cart model
export const cartModel = mongoose.model<Icart>("Cart", IcartSchema);
