import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "user" | "admin";
}

// Creating the Schema that the document fields will follow to be stored in the database

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false — the hash is never returned unless a query explicitly
    // asks for it with .select("+password"), so it cannot leak by accident.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

// Registers a model for the user collection.
// Links the schema (userSchema) to the collection ("user").
// Provides an object (userModel) that you can use to interact with the collection in your database.

const userModel = mongoose.model<IUser>("users", userSchema);

export default userModel;
