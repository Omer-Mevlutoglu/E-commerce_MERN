import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ProductCard from "../Components/ProductCard";
import ProductCardSkeleton from "../Components/states/ProductCardSkeleton";
import StateMessage from "../Components/states/StateMessage";
import { api, errorMessage } from "../api/client";
import {
  CATEGORY_META,
  Paginated,
  PRODUCT_CATEGORIES,
  product,
} from "../types/product";

const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [products, setProducts] = useState<product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await api.get<Paginated<product>>(
          "/products?limit=6&sort=newest",
          { auth: false }
        );
        if (!cancelled) setProducts(data.items);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Could not load products"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      {/* Hero */}
      <Box
        sx={{
          minHeight: { xs: "70vh", md: "100vh" },
          backgroundImage: 'url("/images/hero-banner.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&:before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundColor: alpha(theme.palette.common.black, 0.45),
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            textAlign: "center",
            color: "common.white",
            p: { xs: 3, md: 6 },
            maxWidth: 800,
            mx: 2,
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontWeight: 800,
              mb: 3,
              fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem" },
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            LAPTOPIA
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              fontSize: { xs: "1.1rem", sm: "1.3rem", md: "1.7rem" },
              fontWeight: 300,
              letterSpacing: "0.05em",
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            Discover Your Perfect Computing Companion
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/products")}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: "1.1rem",
              fontWeight: 600,
              borderRadius: 2,
              textTransform: "none",
              boxShadow: theme.shadows[4],
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: theme.shadows[8],
              },
              transition: "all 0.3s ease",
            }}
          >
            Shop the collection
          </Button>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Featured */}
        <Box sx={{ mb: 10 }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}
          >
            Featured Products
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ mb: 6, textAlign: "center", color: "text.secondary" }}
          >
            The latest additions to the shelves
          </Typography>

          {isLoading ? (
            <Grid container spacing={4}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <ProductCardSkeleton />
                </Grid>
              ))}
            </Grid>
          ) : error ? (
            <StateMessage
              icon="⚠️"
              title="Couldn't load products"
              description={error}
              actionLabel="Try again"
              onAction={() => window.location.reload()}
            />
          ) : products.length === 0 ? (
            <StateMessage
              icon="📦"
              title="Nothing in the catalogue yet"
              description="Products will appear here as soon as they are added."
            />
          ) : (
            <>
              <Grid container spacing={4}>
                {products.map((p) => (
                  <Grid item xs={12} sm={6} md={4} key={p._id}>
                    <ProductCard {...p} />
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ textAlign: "center", mt: 6 }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/products")}
                  sx={{ borderRadius: 20, px: 5, fontWeight: 600 }}
                >
                  View all products
                </Button>
              </Box>
            </>
          )}
        </Box>

        {/* Categories — these now actually filter the catalogue. */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}
          >
            Shop by Category
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ mb: 6, textAlign: "center", color: "text.secondary" }}
          >
            Find the perfect device for your needs
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            {PRODUCT_CATEGORIES.map((value) => {
              const meta = CATEGORY_META[value];
              return (
                <Grid item xs={6} sm={3} key={value}>
                  <Card
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/products?category=${value}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/products?category=${value}`);
                      }
                    }}
                    sx={{
                      p: 3,
                      height: "100%",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      "&:hover, &:focus-visible": {
                        transform: "translateY(-8px)",
                        boxShadow: theme.shadows[8],
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: "2.5rem", mb: 2 }}>
                      {meta.icon}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, textAlign: "center" }}
                    >
                      {meta.label}
                    </Typography>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
