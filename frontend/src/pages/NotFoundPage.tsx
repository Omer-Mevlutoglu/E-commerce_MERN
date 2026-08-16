import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

/**
 * Unknown URLs used to redirect silently to "/", which hid broken links —
 * including the app's own footer links — and made typos look like the home page.
 */
const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 14, md: 18 }, minHeight: "80vh" }}>
      <Box sx={{ textAlign: "center" }}>
        <Typography
          variant="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "5rem", md: "7rem" },
            lineHeight: 1,
            color: "primary.main",
          }}
        >
          404
        </Typography>

        <Typography variant="h5" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
          This page doesn't exist
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          The link may be out of date, or the address might have a typo in it.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
        >
          <Button
            variant="contained"
            onClick={() => navigate("/")}
            sx={{ borderRadius: 20, px: 4, fontWeight: 600 }}
          >
            Back to home
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/products")}
            sx={{ borderRadius: 20, px: 4, fontWeight: 600 }}
          >
            Browse products
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
