import productModel from "../models/productModel";

/** The public catalogue: retired products are excluded. */
export const getAllProducts = async () => {
  return productModel.find({ isActive: true }).sort({ createdAt: -1 });
};

/** Admin listing: includes retired products so they can be restored. */
export const getAllProductsForAdmin = async () => {
  return productModel.find().sort({ createdAt: -1 });
};

export const seedIntialProducts = async () => {
  const products = [
    {
      title: "Dell Laptop",
      image: "https://i.ebayimg.com/images/g/vfQAAOSw5PlklTsG/s-l1600.jpg",
      price: 1200,
      stock: 10,
    },
    {
      title: "Lenovo Laptop",
      image:
        "https://cdn.akakce.com/lenovo/lenovo-yoga-creator-7-15imh05-82ds000wtx-i7-10750h-16-gb-1-tb-ssd-gtx1650-15-6-full-hd-notebook-z.jpg",
      price: 900,
      stock: 8,
    },
    {
      title: "HP Laptop",
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
