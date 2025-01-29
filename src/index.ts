import express from "express";
import mongoose from "mongoose";
import userRoute from "./routes/userRoute";
import { seedIntialProducts } from "./services/productService";
import productRoute from "./routes/productRoute";

const app = express();

const port = 3001;

// converts the js object to json
app.use(express.json());

mongoose
  .connect("mongodb://localhost:27017/ecommerceMern")
  .then(() => console.log("Connetced"))
  .catch((err) => console.log("Failed to connect", err));

// seed the default products to db
seedIntialProducts();
app.use("/users", userRoute);
app.use("/product", productRoute);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
