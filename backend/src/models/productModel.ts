import mongoose, { Schema, Document } from "mongoose";

export interface Iproduct extends Document {
  title: string;
  image: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<Iproduct>(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },

    // Soft delete. A hard delete left dangling references in every active cart
    // that held the product, and orders reference products only by copied
    // values, so history stays intact either way. Retiring instead of removing
    // keeps both consistent.
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

// The catalogue is always read as "active products".
productSchema.index({ isActive: 1 });
// Supports search in §1.4 without a collection scan.
productSchema.index({ title: "text" });

const productModel = mongoose.model<Iproduct>("product", productSchema);

export default productModel;
