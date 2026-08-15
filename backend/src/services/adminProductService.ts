// services/adminProductService.ts
import productModel, { Iproduct } from "../models/productModel";
import { NotFound } from "../utils/AppError";

interface CreateProductParams {
  title: string;
  image: string;
  price: number;
  stock: number;
}

export const createProduct = async (
  params: CreateProductParams
): Promise<Iproduct> => {
  return productModel.create(params);
};

export const updateProduct = async (
  productId: string,
  updates: Partial<CreateProductParams & { isActive: boolean }>
): Promise<Iproduct> => {
  const updated = await productModel.findByIdAndUpdate(productId, updates, {
    new: true,
    runValidators: true,
  });

  // Previously this returned null and the route answered 200 with an empty
  // body, so deleting a product in another tab looked like a successful edit.
  if (!updated) {
    throw NotFound("Product not found", "ProductNotFound");
  }

  return updated;
};

/**
 * Retires a product instead of removing it.
 *
 * A hard delete left dangling ObjectId references in every active cart holding
 * the product, which surfaced as nulls after population. Retiring hides it from
 * the catalogue while keeping those references resolvable.
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  const product = await productModel.findByIdAndUpdate(productId, {
    isActive: false,
  });

  if (!product) {
    throw NotFound("Product not found", "ProductNotFound");
  }
};

/** Undoes a retirement. */
export const restoreProduct = async (productId: string): Promise<Iproduct> => {
  const product = await productModel.findByIdAndUpdate(
    productId,
    { isActive: true },
    { new: true }
  );

  if (!product) {
    throw NotFound("Product not found", "ProductNotFound");
  }

  return product;
};
