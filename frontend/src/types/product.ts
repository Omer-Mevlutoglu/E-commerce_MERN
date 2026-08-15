export interface product {
  _id: string;
  title: string;
  image: string;
  /** The API returns a number; this was previously typed as a string. */
  price: number;
  stock: number;
  isActive?: boolean;
}
