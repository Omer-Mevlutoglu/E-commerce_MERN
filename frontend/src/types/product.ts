export const PRODUCT_CATEGORIES = [
  "laptops",
  "gaming",
  "ultrabooks",
  "accessories",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Display metadata for the category tiles and filter chips. */
export const CATEGORY_META: Record<
  ProductCategory,
  { label: string; icon: string }
> = {
  laptops: { label: "Laptops", icon: "💻" },
  gaming: { label: "Gaming", icon: "🎮" },
  ultrabooks: { label: "Ultrabooks", icon: "🪶" },
  accessories: { label: "Accessories", icon: "🎧" },
};

export interface product {
  _id: string;
  title: string;
  description?: string;
  brand?: string;
  category?: ProductCategory;
  image: string;
  /** The API returns a number; this was previously typed as a string. */
  price: number;
  stock: number;
  isActive?: boolean;
}

/** The shape every catalogue listing comes back in. */
export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export type ProductSort = "newest" | "price-asc" | "price-desc" | "title-asc";

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "title-asc", label: "Name: A to Z" },
];
