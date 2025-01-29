import productModel from "../models/productModel";

export const getAllProducts = async () => {
  return await productModel.find();
};

export const seedIntialProducts = async () => {
  const products = [
    {
      title: "Dell Laptop",
      image: "https://i.ebayimg.com/images/g/vfQAAOSw5PlklTsG/s-l1600.jpg",
      price: 15000,
      stock: 10,
    },
  ];

  const existingProducts = await getAllProducts();

  if (existingProducts.length === 0) {
    await productModel.insertMany(products);
  }
};
