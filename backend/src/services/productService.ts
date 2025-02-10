import productModel from "../models/productModel";

export const getAllProducts = async () => {
  try {
    return await productModel.find();
  } catch (error) {
    throw new Error("Failed to fetch products");
  }
};

export const seedIntialProducts = async () => {
  try {
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

    const existingProducts = await getAllProducts();

    if (existingProducts.length === 0) {
      await productModel.insertMany(products);
    }
  } catch (error) {
    throw new Error("Failed to seed initial products");
  }
};
