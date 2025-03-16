import { Box, Button, Container, Typography } from "@mui/material";
import { useCart } from "../context/Cart/CartContext";

const CartPage = () => {
  const {
    cartItem,
    totalAmount,
    updateItemInCart,
    showError,
    DeleteItemInCart,
  } = useCart();

  const handleQuantity = (
    productId: string,
    quantity: number,
    stock: number
  ) => {
    if (quantity <= 0) {
      return;
    }
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
    <Container fixed sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Cart
      </Typography>

      {cartItem.length === 0 ? (
        <Typography variant="body1">Your cart is empty.</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {cartItem.map((item) => (
            <Box
              key={item.productId}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 2,
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                gap: 2,
              }}
            >
              {/* Product Image */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  flexShrink: 0,
                  overflow: "hidden",
                  borderRadius: 1,
                  border: "1px solid #ddd",
                }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>

              {/* Product Title and Controls */}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{item.title}</Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Quantity:
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() =>
                      handleQuantity(
                        item.productId,
                        item.quantity - 1,
                        item.stock
                      )
                    }
                  >
                    -
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {item.quantity}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() =>
                      handleQuantity(
                        item.productId,
                        item.quantity + 1,
                        item.stock
                      )
                    }
                  >
                    +
                  </Button>
                  <Button
                    variant="text"
                    color="error"
                    size="small"
                    sx={{ ml: 2 }}
                    onClick={() => removeItemInCart(item.productId)}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>

              {/* Price Calculation */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {` ${item.quantity} x ${item.unitPrice} `} $
                </Typography>
              </Box>
            </Box>
          ))}

          {/* Cart Summary / Checkout Section */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
            }}
          >
            <Typography variant="h6">Total: {totalAmount} $</Typography>
            <Button variant="contained" color="primary">
              Checkout
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default CartPage;
