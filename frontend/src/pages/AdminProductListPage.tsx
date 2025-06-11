// src/pages/AdminProductListPage.tsx
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { useAuth } from "../context/Auth/AuthContext";

interface Product {
  _id: string;
  title: string;
  image: string;
  price: number;
  stock: number;
}

const BASE_URL = import.meta.env.VITE_BASE_URL;

const AdminProductListPage = () => {
  const { token } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/product`);
        if (!response.ok) {
          throw new Error("Failed to load products");
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    try {
      const resp = await fetch(`${BASE_URL}/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) {
        throw new Error("Delete failed");
      }
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <Typography variant="h4" gutterBottom>
        All Products (Admin)
      </Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product._id}>
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardMedia
                component="img"
                height="180"
                image={product.image}
                alt={product.title}
                sx={{ objectFit: "contain", bgcolor: "background.paper" }}
              />
              <CardContent
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {product.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Price: ${product.price.toFixed(2)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Stock: {product.stock}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleDelete(product._id)}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminProductListPage;
