import { Box, Container } from "@mui/material";
import Typography from "@mui/material/Typography";
import { useState } from "react";
// import { useAuth } from "../context/Auth/AuthContext";
import { useCart } from "../context/Cart/CartContext";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const CartPage = () => {
  const { cartItem, totalAmount } = useCart();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState("");

  return (
    <Container sx={{ mt: 2, px: { xs: 2, sm: 2, md: 0 } }}>
      <Typography variant="h4" color="initial">
        My Cart
      </Typography>
      {cartItem.map((i) => (
        <Box key={i.productId}> {i.title} </Box>
      ))}
    </Container>
  );
};

export default CartPage;
