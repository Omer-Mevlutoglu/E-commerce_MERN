import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  TextField,
  Card,
  useTheme,
  alpha,
} from "@mui/material";
import ProductCard from "../Components/ProductCard";
import { product } from "../types/product";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const HomePage = () => {
  const theme = useTheme();
  const [products, setProducts] = useState<product[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${BASE_URL}/product`);
        const data = await response.json();
        setProducts(data);
      } catch {
        setError(true);
      }
    })();
  }, []);

  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        Something went wrong. Please try again later.
      </Box>
    );
  }

  const featured = products.slice(0, 6);

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      {/* Hero Section with improved styling */}
      <Box
        sx={{
          height: "100vh",
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
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.common.black, 0.4),
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
            onClick={() =>
              window.scrollTo({
                top: window.innerHeight * 0.9,
                behavior: "smooth",
              })
            }
          >
            Explore Collection
          </Button>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Featured Products Section */}
        <Box sx={{ mb: 10 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 1,
              textAlign: "center",
            }}
          >
            Featured Products
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              mb: 6,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            Discover our most popular and trending laptops
          </Typography>
          <Grid container spacing={4}>
            {featured.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p._id}>
                <ProductCard {...p} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Categories Section */}
        <Box sx={{ mb: 10 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 1,
              textAlign: "center",
            }}
          >
            Shop by Category
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              mb: 6,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            Find the perfect device for your needs
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {(
              [
                { name: "Laptops", icon: "💻" },
                { name: "Gaming", icon: "🎮" },
                { name: "Ultrabooks", icon: "📱" },
                { name: "Accessories", icon: "🎧" },
              ] as const
            ).map((cat) => (
              <Grid item xs={6} sm={3} key={cat.name}>
                <Card
                  sx={{
                    p: 3,
                    height: "100%",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: theme.shadows[8],
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                  onClick={() => {
                    /* navigate to category */
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "2.5rem",
                      mb: 2,
                    }}
                  >
                    {cat.icon}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    {cat.name}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Newsletter Section */}
        <Box
          sx={{
            py: 8,
            px: { xs: 3, md: 8 },
            backgroundColor:
              theme.palette.mode === "light"
                ? alpha(theme.palette.primary.main, 0.05)
                : alpha(theme.palette.primary.main, 0.1),
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Stay Updated
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              mb: 4,
              maxWidth: 600,
              mx: "auto",
              color: "text.secondary",
            }}
          >
            Subscribe to our newsletter for exclusive deals, latest product
            launches, and tech news.
          </Typography>
          <Box
            component="form"
            sx={{
              display: "flex",
              gap: 2,
              maxWidth: 500,
              mx: "auto",
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <TextField
              placeholder="Enter your email"
              fullWidth
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
            <Button
              variant="contained"
              size="large"
              sx={{
                px: 4,
                minWidth: { xs: "100%", sm: "auto" },
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Subscribe
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
