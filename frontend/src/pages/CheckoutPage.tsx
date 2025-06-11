import {
  Box,
  Button,
  Container,
  Grid2,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useCart } from "../context/Cart/CartContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/Auth/AuthContext";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LockIcon from "@mui/icons-material/Lock";
import { useRef } from "react";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const CheckoutPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { cartItem, totalAmount, showError, ClearCart } = useCart();
  const { username, token } = useAuth();

  const fullNameref = useRef<HTMLInputElement>(null);
  const addressref = useRef<HTMLInputElement>(null);
  const cardNumberref = useRef<HTMLInputElement>(null);
  const expref = useRef<HTMLInputElement>(null);
  const cvcref = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const fullName = fullNameref.current?.value;
      const address = addressref.current?.value;
      const cardNumber = cardNumberref.current?.value;
      const exp = expref.current?.value;
      const cvc = cvcref.current?.value;

      if (!fullName || !address || !cardNumber || !cvc || !exp) {
        showError("Please fill all required fields");
        return;
      }

      const response = await fetch(`${BASE_URL}/cart/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, address, cardNumber, cvc, exp }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Payment processing failed");
      }

      const orderData = await response.json();

      // Clear cart immediately after successful checkout
      ClearCart();

      // Navigate with order data in state
      navigate("/order-confirmation", {
        state: {
          order: orderData,
          cartItems: [...cartItem], // Clone current cart items
          totalAmount,
        },
      });
    } catch (error) {
      let errorMessage = "Payment failed. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      showError(errorMessage);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 10, minHeight: "80vh" }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 700,
          letterSpacing: 1,
          textAlign: "center",
          textTransform: "uppercase",
          color: "text.primary",
          mb: 4,
        }}
      >
        Checkout
      </Typography>

      {/* Wrap the entire checkout page in a single form */}
      <Box component="form" onSubmit={handleSubmit}>
        <Grid2 container spacing={4}>
          {/* Shipping and Payment Form */}
          <Grid2 size={{ xs: 12, md: 7 }}>
            <Box
              sx={{
                p: 3,
                backgroundColor: "background.paper",
                borderRadius: 4,
                boxShadow: 1,
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                <LockIcon sx={{ fontSize: 20, mr: 1 }} />
                Secure Payment Details
              </Typography>

              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    inputRef={fullNameref}
                    defaultValue={username || ""}
                    required
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid2>

                <Grid2 size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Address"
                    inputRef={addressref}
                    required
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid2>

                <Grid2 size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Card Number"
                    inputRef={cardNumberref}
                    required
                    InputProps={{
                      sx: { borderRadius: 2 },
                      endAdornment: (
                        <CreditCardIcon sx={{ color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid2>

                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Expiration Date"
                    inputRef={expref}
                    placeholder="MM/YY"
                    required
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid2>

                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="CVC"
                    inputRef={cvcref}
                    required
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid2>
              </Grid2>
            </Box>
          </Grid2>

          {/* Order Summary */}
          <Grid2 size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                p: 3,
                backgroundColor: "background.paper",
                borderRadius: 4,
                boxShadow: 1,
                position: "sticky",
                top: 20,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Order Summary
              </Typography>

              {cartItem.map((item) => (
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
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">
                    ${totalAmount.toFixed(2)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 3,
                  }}
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
                    ${totalAmount.toFixed(2)}
                  </Typography>
                </Box>

                {/* Place Order Button */}
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  sx={{
                    mt: 3,
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
                >
                  Place Order
                </Button>

                {/* Cancel Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                  }}
                  onClick={() => navigate("/cart")}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Grid2>
        </Grid2>
      </Box>
    </Container>
  );
};

export default CheckoutPage;
