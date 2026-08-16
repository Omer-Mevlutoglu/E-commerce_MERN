import mongoose, { Schema, Document } from "mongoose";

/** Fixed set, so the storefront's category tiles can be trusted to match. */
export const PRODUCT_CATEGORIES = [
  "laptops",
  "gaming",
  "ultrabooks",
  "accessories",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Iproduct extends Document {
  title: string;
  description: string;
  brand: string;
  category: ProductCategory;
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
    description: { type: String, default: "", trim: true },
    brand: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      default: "laptops",
      required: true,
    },
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

// The catalogue is always read as "active products", usually within a category.
productSchema.index({ isActive: 1, category: 1 });
// Backs the search box. Weighted so a title match outranks a description match.
productSchema.index(
  { title: "text", description: "text", brand: "text" },
  { weights: { title: 10, brand: 5, description: 1 }, name: "product_search" }
);

const productModel = mongoose.model<Iproduct>("product", productSchema);

export default productModel;
