import { Box, Button, Container, TextField, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { useAuth } from "../context/Auth/AuthContext";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const AdminAddProductPage = () => {
  const titleRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = titleRef.current?.value.trim();
    const image = imageRef.current?.value.trim();
    const price = Number(priceRef.current?.value);
    const stock = Number(stockRef.current?.value);

    if (!title || !image || isNaN(price) || isNaN(stock)) {
      setError("All fields are required and must be valid.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, image, price, stock }),
      });
      if (!response.ok) {
        throw new Error("Failed to add product");
      }
      // Optionally: you could clear the form or navigate elsewhere
      navigate("/admin/products/list");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Add New Product
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField inputRef={titleRef} label="Title" required />
        <TextField inputRef={imageRef} label="Image URL" required />
        <TextField
          inputRef={priceRef}
          label="Price"
          type="number"
          required
          InputProps={{ inputProps: { min: 0, step: 0.01 } }}
        />
        <TextField
          inputRef={stockRef}
          label="Stock"
          type="number"
          required
          InputProps={{ inputProps: { min: 0, step: 1 } }}
        />
        <Button type="submit" variant="contained">
          Create Product
        </Button>
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default AdminAddProductPage;
