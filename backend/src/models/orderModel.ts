import mongoose, { Document, ObjectId, Schema } from "mongoose";

export interface IorderItem {
  productTtile: string;
  productImage: string;
  unitprice: number;
  quantity: number;
}

/**
 * Payment record.
 *
 * Holds only values that are safe to persist. The full card number, the CVC
 * and the expiry date are never sent to the server and never stored — storing
 * a CVC is prohibited outright by PCI DSS, and holding a PAN would put this
 * application in scope for a compliance regime it cannot satisfy.
 *
 * `reference` is where a real provider's transaction id (e.g. a Stripe
 * PaymentIntent id) will go once a payment gateway is integrated.
 */
export interface Ipayment {
  method: "mock" | "stripe";
  status: "pending" | "paid" | "failed" | "refunded";
  last4?: string;
  brand?: string;
  reference?: string;
}

export interface Iorder extends Document {
  orderItems: IorderItem[];
  total: number;
  address: string;
  fullName: string;
  payment: Ipayment;
  userId: ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const IorderItemSchema = new Schema<IorderItem>({
  productTtile: { type: String, required: true },
  productImage: { type: String, required: true },
  unitprice: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const paymentSchema = new Schema<Ipayment>(
  {
    method: { type: String, enum: ["mock", "stripe"], default: "mock" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    last4: { type: String },
    brand: { type: String },
    reference: { type: String },
  },
  { _id: false }
);

const orderSchema = new Schema<Iorder>(
  {
    orderItems: [IorderItemSchema],
    total: { type: Number, required: true },
    address: { type: String, required: true },
    fullName: { type: String, required: true },
    payment: { type: paymentSchema, default: () => ({}) },

    userId: {
      type: mongoose.Schema.Types.ObjectId, // Store reference to a user
      ref: "users", // Refers to the users collection
      required: true,
    },
  },
  { timestamps: true }
);

// Order history is always read newest-first, per user.
orderSchema.index({ userId: 1, createdAt: -1 });

export const orderModel = mongoose.model<Iorder>("orders", orderSchema);
