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
        price: 15000,
        stock: 10,
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
