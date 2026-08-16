import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useCart } from "../context/Cart/CartContext";
import { useAuth } from "../context/Auth/AuthContext";
import { Box, Chip, SxProps, Theme, Tooltip } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { CATEGORY_META, ProductCategory } from "../types/product";

interface Props {
  _id: string;
  title: string;
  image: string;
  price: number;
  stock?: number;
  category?: ProductCategory;
}

export default function ProductCard({
  _id,
  title,
  image,
  price,
  stock,
  category,
}: Props) {
  const { addItemToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const outOfStock = stock === 0;

  const cardStyles: SxProps<Theme> = {
    position: "relative",
    borderRadius: 4,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
    },
  };

  const imageStyles: SxProps<Theme> = {
    height: 240,
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundColor: "background.paper",
  };

  return (
    <Card sx={cardStyles}>
      {/* The whole media + text block is the link to the detail page. */}
      <Box
        component={RouterLink}
        to={`/products/${_id}`}
        sx={{ textDecoration: "none", color: "inherit", flexGrow: 1 }}
      >
        <CardMedia sx={imageStyles} image={image} title={title} />

        <CardContent sx={{ px: 2.5, pt: 2, pb: 1 }}>
          {category && (
            <Chip
              label={CATEGORY_META[category]?.label ?? category}
              size="small"
              sx={{ mb: 1 }}
            />
          )}

          <Typography
            gutterBottom
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              minHeight: 56,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              color: "text.primary",
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "primary.main",
                fontWeight: 700,
                fontSize: "1.25rem",
              }}
            >
              ${price.toFixed(2)}
            </Typography>

            {/* Stock was already on every product but never surfaced. */}
            {stock !== undefined && stock <= 5 && (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: outOfStock ? "error.main" : "warning.main",
                }}
              >
                {outOfStock ? "Out of stock" : `Only ${stock} left`}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Box>

      <CardActions sx={{ px: 2.5, pb: 2.5 }}>
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
          <span style={{ width: "100%" }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => addItemToCart(_id)}
              disabled={!isAuthenticated || outOfStock}
              sx={{
                py: 1.2,
                borderRadius: 2,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "none",
                fontSize: "1rem",
                boxShadow: "none",
                "&:disabled": {
                  opacity: 0.7,
                  backgroundColor: "action.disabledBackground",
                  color: "text.disabled",
                },
                "&:hover:not(:disabled)": {
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              {!isAuthenticated
                ? "Login to Purchase"
                : outOfStock
                  ? "Out of Stock"
                  : "Add to Cart"}
            </Button>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
