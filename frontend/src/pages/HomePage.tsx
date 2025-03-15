import { Box, Container, Grid2 } from "@mui/material";
import { useEffect, useState } from "react";
import { product } from "../types/product";
import ProductCard from "../Components/ProductCard";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const HomePage = () => {
  const [products, setProducts] = useState<product[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/product`);
        const data = await response.json();
        setProducts(data);
      } catch {
        setError(true);
      }
    };
    fetchData();
  }, []);

  if (error) {
    return <Box>Something went wrong try again later</Box>;
  }
  return (
    <Container sx={{ mt: 2, px: { xs: 2, sm: 2, md: 0 } }}>
      <Grid2 container spacing={2}>
        {products.map((p) => (
          <Grid2 key={p._id} size={{ xs: 12, sm: 6, md: 4 }}>
            <ProductCard {...p} />
          </Grid2>
        ))}
      </Grid2>
    </Container>
  );
};

export default HomePage;
