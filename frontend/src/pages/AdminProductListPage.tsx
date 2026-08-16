// src/pages/AdminProductListPage.tsx
import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api, errorMessage } from "../api/client";
import { useFeedback } from "../context/Feedback/FeedbackContext";
import ProductCardSkeleton from "../Components/states/ProductCardSkeleton";
import StateMessage from "../Components/states/StateMessage";
import { CATEGORY_META, Paginated, product } from "../types/product";

const AdminProductListPage = () => {
  const navigate = useNavigate();
  const { showSuccess } = useFeedback();

  const [products, setProducts] = useState<product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      // The admin listing, not the public catalogue — it includes retired
      // products so they can be restored.
      const data = await api.get<Paginated<product>>(
        "/admin/products?limit=48"
      );
      setProducts(data.items);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, "Failed to load products"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      showSuccess(isActive ? "Product restored" : "Product retired");
      setError(null);
    } catch (err) {
      setError(
        errorMessage(
          err,
          isActive ? "Restore failed" : "Could not retire product"
        )
      );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 12, md: 14 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          All Products
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/admin/products/add")}
        >
          Add product
        </Button>
      </Stack>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {isLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <ProductCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : products.length === 0 ? (
        <StateMessage
          icon="📦"
          title="No products yet"
          description="Add the first product to get the catalogue started."
          actionLabel="Add product"
          onAction={() => navigate("/admin/products/add")}
        />
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product._id}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: 3,
                  height: "100%",
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
                      <Chip label="Retired" size="small" />
                    )}
                  </Box>

                  {product.category && (
                    <Chip
                      label={
                        CATEGORY_META[product.category]?.label ??
                        product.category
                      }
                      size="small"
                      variant="outlined"
                      sx={{ alignSelf: "flex-start" }}
                    />
                  )}

                  <Typography variant="body1" color="text.secondary">
                    Price: ${product.price.toFixed(2)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Stock: {product.stock}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        navigate(`/admin/products/edit/${product._id}`)
                      }
                    >
                      Edit
                    </Button>
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
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default AdminProductListPage;
