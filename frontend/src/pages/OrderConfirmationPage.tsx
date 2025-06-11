import {
  Box,
  Button,
  Container,
  Grid2,
  Typography,
  useTheme,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/Cart/CartContext";
import { useAuth } from "../context/Auth/AuthContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import React from "react";
import { CartItem } from "../types/CartItem"; // Import CartItem type

const OrderConfirmationPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { ClearCart } = useCart();
  const { username } = useAuth();
  const { state } = useLocation();
  const { cartItem, totalAmount } = state || {};
  const displayItems: CartItem[] = cartItem || [];
  const displayTotal = totalAmount || 0;

  // Clear cart when leaving confirmation page
  React.useEffect(() => {
    return () => ClearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 10, minHeight: "80vh" }}>
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <CheckCircleIcon
          sx={{
            fontSize: 80,
            color: "success.main",
            mb: 3,
          }}
        />
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "text.primary",
          }}
        >
          Order Confirmed!
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Thank you for your purchase, {username}!
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Your order details have been sent to your email.
        </Typography>
      </Box>

      <Grid2 container spacing={4}>
        {/* Order Summary */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              p: 3,
              backgroundColor: "background.paper",
              borderRadius: 4,
              boxShadow: 1,
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Order Summary
            </Typography>

            {displayItems.map((item: CartItem) => (
              <Box
                key={item.productId}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "background.default",
                }}
              >
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.quantity} x ${item.unitPrice}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </Typography>
              </Box>
            ))}

            <Box
              sx={{ borderTop: `2px solid ${theme.palette.divider}`, pt: 2 }}
            >
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="body1">Subtotal:</Typography>
                <Typography variant="body1">
                  ${displayTotal.toFixed(2)}
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}
              >
                <Typography variant="body1">Shipping:</Typography>
                <Typography variant="body1">FREE</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6">Total:</Typography>
                <Typography
                  variant="h6"
                  sx={{ color: "primary.main", fontWeight: 700 }}
                >
                  ${displayTotal.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid2>

        {/* Shipping Information */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              p: 3,
              backgroundColor: "background.paper",
              borderRadius: 4,
              boxShadow: 1,
              height: "100%",
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Shipping Details
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Shipping Address
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                123 Tech Street
                <br />
                Digital City, DC 54321
                <br />
                United States
              </Typography>
            </Box>

            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Estimated Delivery
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Monday, April 15 - Thursday, April 18
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{
                mt: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
              onClick={() => navigate("/")}
            >
              Continue Shopping
            </Button>
          </Box>
        </Grid2>
      </Grid2>
    </Container>
  );
};

export default OrderConfirmationPage;
