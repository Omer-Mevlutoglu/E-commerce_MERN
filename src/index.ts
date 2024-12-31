import express from "express";
import mongoose from "mongoose";
import userRoute from "./routes/userRoute";

const app = express();

const port = 3001;

// converts the js object to json 
app.use(express.json());

mongoose
  .connect("mongodb://localhost:27017/ecommerceMern")
  .then(() => console.log("Connetced"))
  .catch((err) => console.log("Failed to connect", err));

app.use("/users", userRoute);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
