import { Box, Button, Container, Typography, useTheme } from "@mui/material";
import { useCart } from "../context/Cart/CartContext";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    cartItem,
    totalAmount,
    updateItemInCart,
    showError,
    DeleteItemInCart,
    ClearCart,
  } = useCart();

  const handleQuantity = (
    productId: string,
    quantity: number,
    stock: number
  ) => {
    if (quantity <= 0) return;
    if (quantity > stock) {
      showError("Cannot add more items. Stock limit reached.");
      return;
    }
    updateItemInCart(productId, quantity, stock);
  };

  const removeItemInCart = (productId: string) => {
    DeleteItemInCart(productId);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: "80vh" }}>
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
        Your Shopping Cart
      </Typography>

      {cartItem.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 10,
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 4,
            backgroundColor: "background.paper",
          }}
        >
          <Typography variant="h6" sx={{ mb: 3 }}>
            Your cart is empty
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/")}
            sx={{
              borderRadius: 20,
              px: 4,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            Browse Products
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {cartItem.map((item) => (
            <Box
              key={item.productId}
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "center",
                p: { xs: 2, sm: 3 },
                backgroundColor: "background.paper",
                borderRadius: 4,
                gap: 3,
                boxShadow: 1,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  boxShadow: 3,
                  transform: "translateY(-2px)",
                },
              }}
            >
              {/* Product Image */}
              <Box
                sx={{
                  width: { xs: "100%", sm: 120 },
                  height: { xs: 200, sm: 120 },
                  flexShrink: 0,
                  overflow: "hidden",
                  borderRadius: 3,
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

              {/* Product Details and Quantity Controls */}
              <Box
                sx={{ flexGrow: 1, textAlign: { xs: "center", sm: "left" } }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: "text.primary",
                  }}
                >
                  {item.title}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: "center",
                    gap: 2,
                    mt: 2,
                    justifyContent: { xs: "center", sm: "flex-start" },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      p: 0.5,
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={() =>
                        handleQuantity(
                          item.productId,
                          item.quantity - 1,
                          item.stock
                        )
                      }
                      sx={{
                        minWidth: 32,
                        height: 32,
                        borderRadius: 1,
                        borderColor: "text.secondary",
                        color: "text.primary",
                        "&:hover": {
                          borderColor: "primary.main",
                          backgroundColor: "action.hover",
                        },
                      }}
                    >
                      -
                    </Button>
                    <Typography
                      variant="body1"
                      sx={{
                        minWidth: 40,
                        textAlign: "center",
                        color: "text.primary",
                      }}
                    >
                      {item.quantity}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={() =>
                        handleQuantity(
                          item.productId,
                          item.quantity + 1,
                          item.stock
                        )
                      }
                      sx={{
                        minWidth: 32,
                        height: 32,
                        borderRadius: 1,
                        borderColor: "text.secondary",
                        color: "text.primary",
                        "&:hover": {
                          borderColor: "primary.main",
                          backgroundColor: "action.hover",
                        },
                      }}
                    >
                      +
                    </Button>
                  </Box>

                  <Button
                    variant="text"
                    color="error"
                    size="small"
                    onClick={() => removeItemInCart(item.productId)}
                    sx={{
                      fontWeight: 600,
                      ml: { xs: 0, sm: 2 },
                      mt: { xs: 1, sm: 0 },
                      "&:hover": {
                        backgroundColor: "error.light",
                      },
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>

              {/* Price Calculation */}
              <Box sx={{ textAlign: { xs: "center", sm: "right" } }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    whiteSpace: "nowrap",
                  }}
                >
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    mt: 0.5,
                  }}
                >
                  {item.quantity} x ${item.unitPrice}
                </Typography>
              </Box>
            </Box>
          ))}

          {/* Checkout and Clear Cart Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              p: 3,
              backgroundColor: "background.paper",
              borderRadius: 4,
              boxShadow: 1,
              mt: 2,
              gap: { xs: 2, sm: 0 },
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "text.primary",
              }}
            >
              Total: ${totalAmount.toFixed(2)}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{
                  px: 4,
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
                Proceed to Checkout
              </Button>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  boxShadow: "none",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(156, 39, 176, 0.3)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
                onClick={ClearCart}
              >
                Clear Cart
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default CartPage;
