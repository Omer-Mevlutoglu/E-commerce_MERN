import { Container } from "@mui/material";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useAuth } from "../context/Auth/AuthContext";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const CartPage = () => {
  const [cart, setCart] = useState();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState("");
  const { token } = useAuth();
  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchCart = async () => {
      try {
        const response = await fetch(`${BASE_URL}/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to get user cart. Try again.");
        }

        const data = await response.json();
        setCart(data);
      } catch {
        setError("Failed to get data");
      }
    };

    fetchCart();
  }, [token]);

  console.log({ cart });
  return (
    <Container sx={{ mt: 2, px: { xs: 2, sm: 2, md: 0 } }}>
      <Typography variant="h4" color="initial">
        My Cart
      </Typography>
    </Container>
  );
};

export default CartPage;
