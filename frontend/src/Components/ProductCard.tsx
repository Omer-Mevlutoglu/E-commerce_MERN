import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useCart } from "../context/Cart/CartContext";
import { useAuth } from "../context/Auth/AuthContext";
import { Box, SxProps, Theme, Tooltip } from "@mui/material";

interface Props {
  _id: string;
  title: string;
  image: string;
  price: string;
}

export default function ProductCard({ _id, title, image, price }: Props) {
  const { addItemToCart } = useCart();
  const { isAuthanticated } = useAuth();

  const cardStyles: SxProps<Theme> = {
    position: "relative",
    borderRadius: 4,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
    },
  };

  const imageStyles: SxProps<Theme> = {
    height: 280,
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundColor: "background.paper",
    position: "relative",
    "&:after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "30%",
      background:
        "linear-gradient(to top, rgba(0,0,0,0.1) 0%, transparent 100%)",
    },
  };

  return (
    <Card sx={cardStyles}>
      <CardMedia sx={imageStyles} image={image} title={title} />

      <CardContent sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <Typography
          gutterBottom
          variant="h6"
          component="div"
          sx={{
            fontWeight: 600,
            minHeight: 64,
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
            ${price}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2.5, pb: 2.5 }}>
        <Tooltip
          title={!isAuthanticated ? "Please login to add items to cart" : ""}
          placement="top"
          arrow
        >
          <span>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => addItemToCart(_id)}
              disabled={!isAuthanticated}
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
              {isAuthanticated ? "Add to Cart" : "Login to Purchase"}
            </Button>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
