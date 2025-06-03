// services/adminProductService.ts
import productModel, { Iproduct } from "../models/productModel";

interface CreateProductParams {
  title: string;
  image: string;
  price: number;
  stock: number;
}

export const createProduct = async ({
  title,
  image,
  price,
  stock,
}: CreateProductParams): Promise<Iproduct> => {
  const prod = new productModel({ title, image, price, stock });
  await prod.save();
  return prod;
};

export const updateProduct = async (
  productId: string,
  updates: Partial<{
    title: string;
    image: string;
    price: number;
    stock: number;
  }>
): Promise<Iproduct | null> => {
  return await productModel.findByIdAndUpdate(productId, updates, {
    new: true,
  });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await productModel.findByIdAndDelete(productId);
};
