import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "user" | "admin";
}

// Creating the Schema that the document fields will follow to be stored in the database

const userSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
});

// Registers a model for the user collection.
// Links the schema (userSchema) to the collection ("user").
// Provides an object (userModel) that you can use to interact with the collection in your database.

const userModel = mongoose.model<IUser>("users", userSchema);

export default userModel;
