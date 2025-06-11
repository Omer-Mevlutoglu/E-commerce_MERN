// src/Components/Footer.tsx
import { Box, Container, Link, Typography, Grid2 } from "@mui/material";

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
        <Grid2
          container
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">
              &copy; {year} Laptopia. All rights reserved.
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: { xs: "center", md: "flex-end" },
              }}
            >
              <Link
                href="/privacy"
                variant="body2"
                color="text.secondary"
                underline="hover"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                variant="body2"
                color="text.secondary"
                underline="hover"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                variant="body2"
                color="text.secondary"
                underline="hover"
              >
                Contact Us
              </Link>
            </Box>
          </Grid2>
        </Grid2>
      </Container>
    </Box>
  );
}
