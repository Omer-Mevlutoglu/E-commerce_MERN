import { useEffect, useState } from "react";
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Link,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import VerifiedIcon from "@mui/icons-material/Verified";
import StateMessage from "../Components/states/StateMessage";
import { api, ApiError, errorMessage } from "../api/client";
import { CATEGORY_META, product } from "../types/product";
import { useCart } from "../context/Cart/CartContext";
import { useAuth } from "../context/Auth/AuthContext";

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addItemToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [item, setItem] = useState<product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; notFound: boolean }>({
    message: "",
    notFound: false,
  });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError({ message: "", notFound: false });

    (async () => {
      try {
        const result = await api.get<product>(`/products/${productId}`, {
          auth: false,
        });
        if (!cancelled) setItem(result);
      } catch (err) {
        if (cancelled) return;
        setError({
          message: errorMessage(err, "Could not load this product"),
          notFound: err instanceof ApiError && err.status === 404,
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (isLoading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 12, md: 14 }, minHeight: "80vh" }}
      >
        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <Skeleton
              variant="rectangular"
              height={420}
              sx={{ borderRadius: 4 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton width="70%" height={56} />
            <Skeleton width="30%" height={48} sx={{ mt: 2 }} />
            <Skeleton width="100%" height={100} sx={{ mt: 3 }} />
            <Skeleton
              variant="rectangular"
              height={52}
              sx={{ mt: 4, borderRadius: 2 }}
            />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error.message || !item) {
    return (
      <Container
        maxWidth="md"
        sx={{ py: { xs: 12, md: 14 }, minHeight: "80vh" }}
      >
        <StateMessage
          icon={error.notFound ? "🔍" : "⚠️"}
          title={
            error.notFound
              ? "We couldn't find that product"
              : "Something went wrong"
          }
          description={
            error.notFound
              ? "It may have been removed from the catalogue."
              : error.message
          }
          actionLabel="Browse all products"
          onAction={() => navigate("/products")}
        />
      </Container>
    );
  }

  const outOfStock = item.stock === 0;
  const lowStock = item.stock > 0 && item.stock <= 5;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 12, md: 14 }, minHeight: "80vh" }}>
      <Breadcrumbs sx={{ mb: 4 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Home
        </Link>
        <Link
          component={RouterLink}
          to="/products"
          underline="hover"
          color="inherit"
        >
          Products
        </Link>
        {item.category && (
          <Link
            component={RouterLink}
            to={`/products?category=${item.category}`}
            underline="hover"
            color="inherit"
          >
            {CATEGORY_META[item.category]?.label ?? item.category}
          </Link>
        )}
        <Typography color="text.primary">{item.title}</Typography>
      </Breadcrumbs>

      <Grid container spacing={{ xs: 4, md: 6 }}>
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              backgroundColor: "background.paper",
              boxShadow: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: { xs: 280, md: 420 },
              p: 3,
            }}
          >
            <Box
              component="img"
              src={item.image}
              alt={item.title}
              sx={{ maxWidth: "100%", maxHeight: 420, objectFit: "contain" }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {item.category && (
              <Chip
                label={CATEGORY_META[item.category]?.label ?? item.category}
                size="small"
              />
            )}
            {item.brand && (
              <Chip label={item.brand} size="small" variant="outlined" />
            )}
          </Stack>

          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            {item.title}
          </Typography>

          <Typography
            variant="h4"
            sx={{ color: "primary.main", fontWeight: 700, mb: 2 }}
          >
            ${item.price.toFixed(2)}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              mb: 3,
              color: outOfStock
                ? "error.main"
                : lowStock
                  ? "warning.main"
                  : "success.main",
            }}
          >
            {outOfStock
              ? "Out of stock"
              : lowStock
                ? `Only ${item.stock} left in stock`
                : `In stock — ${item.stock} available`}
          </Typography>

          {item.description && (
            <>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                {item.description}
              </Typography>
            </>
          )}

          <Tooltip
            title={
              !isAuthenticated
                ? "Please login to add items to cart"
                : outOfStock
                  ? "This product is out of stock"
                  : ""
            }
            placement="top"
            arrow
          >
            <span>
              <Button
                variant="contained"
                size="large"
                disabled={!isAuthenticated || outOfStock}
                onClick={() => addItemToCart(item._id)}
                sx={{ py: 1.5, px: 6, borderRadius: 2, fontWeight: 600 }}
              >
                {!isAuthenticated
                  ? "Login to Purchase"
                  : outOfStock
                    ? "Out of Stock"
                    : "Add to Cart"}
              </Button>
            </span>
          </Tooltip>

          <Stack spacing={1.5} sx={{ mt: 4 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocalShippingIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Free delivery on every order
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <VerifiedIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Two-year manufacturer warranty
              </Typography>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductDetailPage;
