// src/Components/Footer.tsx
import { Box, Container, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const REPO_URL = "https://github.com/Omer-Mevlutoglu/E-commerce_MERN";

/**
 * The links here used to point at /privacy, /terms and /contact — none of
 * which are routes, so every one of them bounced off the catch-all back to the
 * home page. Replaced with destinations that exist.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: 8,
        py: 4,
        backgroundColor: "background.paper",
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="body2" color="text.secondary">
            &copy; {year} Laptopia. A portfolio project — no real orders are
            fulfilled.
          </Typography>

          <Stack direction="row" spacing={3}>
            <Link
              component={RouterLink}
              to="/products"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              All products
            </Link>
            <Link
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              Source on GitHub
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
