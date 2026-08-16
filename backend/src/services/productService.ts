import { FilterQuery } from "mongoose";
import productModel, { Iproduct } from "../models/productModel";
import { NotFound } from "../utils/AppError";
import type { ListProductsInput } from "../schemas/product.schema";

export interface PaginatedProducts {
  items: Iproduct[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

const SORTS = {
  newest: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  "title-asc": { title: 1 },
} as const;

/**
 * The catalogue query: filter, search, sort, paginate.
 *
 * Search uses the text index rather than a regex, so it stays usable as the
 * catalogue grows instead of scanning every document.
 */
export const listProducts = async ({
  page,
  limit,
  search,
  category,
  sort,
  includeInactive,
}: ListProductsInput): Promise<PaginatedProducts> => {
  const filter: FilterQuery<Iproduct> = {};

  if (!includeInactive) filter.isActive = true;
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    productModel.find(filter).sort(SORTS[sort]).skip(skip).limit(limit),
    productModel.countDocuments(filter),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasNextPage: skip + items.length < total,
  };
};

export const getProductById = async (
  productId: string,
  { includeInactive = false } = {}
): Promise<Iproduct> => {
  const product = await productModel.findOne(
    includeInactive ? { _id: productId } : { _id: productId, isActive: true }
  );

  if (!product) {
    throw NotFound("Product not found", "ProductNotFound");
  }

  return product;
};

/** Everything still on sale — used by the storefront's featured row. */
export const getAllProducts = async () =>
  productModel.find({ isActive: true }).sort({ createdAt: -1 });

export const seedInitialProducts = async () => {
  const products = [
    {
      title: "Dell XPS 15",
      brand: "Dell",
      category: "laptops" as const,
      description:
        "A 15-inch workhorse with a colour-accurate display, built for long editing sessions and heavy multitasking.",
      image: "https://i.ebayimg.com/images/g/vfQAAOSw5PlklTsG/s-l1600.jpg",
      price: 1200,
      stock: 10,
    },
    {
      title: "Lenovo Yoga Creator 7",
      brand: "Lenovo",
      category: "gaming" as const,
      description:
        "GTX 1650 graphics and a 144Hz panel — equally happy running games or a timeline full of 4K footage.",
      image:
        "https://cdn.akakce.com/lenovo/lenovo-yoga-creator-7-15imh05-82ds000wtx-i7-10750h-16-gb-1-tb-ssd-gtx1650-15-6-full-hd-notebook-z.jpg",
      price: 900,
      stock: 8,
    },
    {
      title: "HP Pavilion 14",
      brand: "HP",
      category: "ultrabooks" as const,
      description:
        "Just over a kilogram, with all-day battery. The one you actually carry rather than the one you meant to.",
      image:
        "https://avatars.mds.yandex.net/i?id=cc5af6c0b7b85a8af2f9c49dd8eebc5b28d408c2-12811218-images-thumbs&n=13",
      price: 1000,
      stock: 20,
    },
  ];

  const existing = await productModel.estimatedDocumentCount();

  if (existing === 0) {
    await productModel.insertMany(products);
    console.log(`[seed] inserted ${products.length} sample products`);
  }
};
