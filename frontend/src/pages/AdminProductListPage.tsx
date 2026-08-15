// src/pages/AdminProductListPage.tsx
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { api, errorMessage } from "../api/client";
import { product } from "../types/product";

const AdminProductListPage = () => {
  const [products, setProducts] = useState<product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // The admin listing, not the public catalogue — it includes retired
        // products so they can be restored.
        setProducts(await api.get<product[]>("/admin/products"));
      } catch (err) {
        setError(errorMessage(err, "Failed to load products"));
      }
    })();
  }, []);

  const setActive = async (productId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await api.post(`/admin/products/${productId}/restore`);
      } else {
        await api.delete(`/admin/products/${productId}`);
      }
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, isActive } : p))
      );
      setError(null);
    } catch (err) {
      setError(
        errorMessage(err, isActive ? "Restore failed" : "Could not retire product")
      );
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
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: 3,
                opacity: product.isActive === false ? 0.55 : 1,
              }}
            >
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
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {product.title}
                  </Typography>
                  {product.isActive === false && (
                    <Chip label="Retired" size="small" color="default" />
                  )}
                </Box>
                <Typography variant="body1" color="text.secondary">
                  Price: ${product.price.toFixed(2)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Stock: {product.stock}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  {product.isActive === false ? (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => setActive(product._id, true)}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => setActive(product._id, false)}
                    >
                      Retire
                    </Button>
                  )}
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
