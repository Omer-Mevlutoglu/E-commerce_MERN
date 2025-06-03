import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import AdbIcon from "@mui/icons-material/Adb";
import { useAuth } from "../context/Auth/AuthContext";
import { Button, Badge } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useCart } from "../context/Cart/CartContext";

const settings = ["My Orders", "Logout"];

function Navbar() {
  const { cartItem } = useCart();
  const { username, isAuthenticated, isAdmin, logout } = useAuth();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  const navigate = useNavigate();

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogin = () => navigate("/login");
  const handleLogout = () => {
    logout();
    navigate("/");
    handleCloseUserMenu();
  };
  const handleCart = () => navigate("/cart");
  const handleMyOrders = () => {
    navigate("/my-orders");
    handleCloseUserMenu();
  };
  const handleManageProducts = () => navigate("/admin/products/list");
  const handleAddProducts = () => navigate("/admin/products/add");
  const handleViewOrders = () => navigate("/admin/orders");

  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: "primary.main",
        boxShadow: "none",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{ py: { xs: 0.5, md: 1 }, px: { xs: 1, sm: 0 } }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
              gap: { xs: 1, sm: 2 },
            }}
          >
            {/* Logo (always visible) */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&:hover": { cursor: "pointer" },
              }}
              onClick={() => navigate("/")}
            >
              <AdbIcon
                sx={{
                  fontSize: { xs: 26, md: 32 },
                  color: "secondary.main",
                  display: { xs: "none", sm: "flex" },
                }}
              />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  letterSpacing: { xs: 0.5, md: 1.2 },
                  color: "common.white",
                  fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.5rem" },
                  transition: "color 0.3s ease",
                  "&:hover": { color: "secondary.main" },
                  ml: { xs: 0, sm: 1 },
                }}
              >
                LAPTOPIA
              </Typography>
            </Box>

            {/* Right Section */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, sm: 2, md: 3 },
                color: "common.white",
              }}
            >
              {/* 1) If a “user” is logged in, show their Cart icon */}
              {!isAdmin && isAuthenticated && (
                <IconButton
                  aria-label="cart"
                  onClick={handleCart}
                  sx={{
                    p: { xs: "6px", md: "8px" },
                    "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.08)" },
                  }}
                >
                  <Badge
                    badgeContent={cartItem.length}
                    color="secondary"
                    sx={{
                      "& .MuiBadge-badge": {
                        right: { xs: -2, md: -4 },
                        top: { xs: 4, md: 8 },
                        fontWeight: 600,
                        fontSize: { xs: "0.7rem", md: "0.8rem" },
                      },
                    }}
                  >
                    <ShoppingCartIcon
                      sx={{
                        fontSize: { xs: 24, md: 28 },
                        color: "common.white",
                        "&:hover": { color: "secondary.main" },
                      }}
                    />
                  </Badge>
                </IconButton>
              )}

              {/* 2) If an admin is logged in, show only admin links */}
              {isAuthenticated && isAdmin && (
                <>
                  <Button color="inherit" onClick={handleAddProducts}>
                    Add Products
                  </Button>
                  <Button color="inherit" onClick={handleManageProducts}>
                    Manage Products
                  </Button>
                  <Button color="inherit" onClick={handleViewOrders}>
                    View Orders
                  </Button>
                  <Button color="inherit" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              )}

              {/* 3) If a regular user is logged in, show their avatar / dropdown */}
              {!isAdmin && isAuthenticated ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Tooltip title="Account settings">
                    <IconButton
                      onClick={handleOpenUserMenu}
                      sx={{
                        p: 0.5,
                        border: "2px solid",
                        borderColor: "common.white",
                        "&:hover": { borderColor: "secondary.main" },
                      }}
                    >
                      <Avatar
                        alt={username || ""}
                        sx={{
                          bgcolor: "secondary.main",
                          width: { xs: 32, md: 36 },
                          height: { xs: 32, md: 36 },
                          fontSize: { xs: "0.9rem", md: "1rem" },
                        }}
                      >
                        {username?.[0]?.toUpperCase()}
                      </Avatar>
                    </IconButton>
                  </Tooltip>

                  <Menu
                    sx={{ mt: "45px" }}
                    PaperProps={{
                      sx: {
                        minWidth: 160,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        "& .MuiMenuItem-root": {
                          typography: "body2",
                          fontWeight: 500,
                          py: 1.2,
                          fontSize: { xs: "0.9rem", md: "1rem" },
                        },
                      },
                    }}
                    anchorEl={anchorElUser}
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    keepMounted
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    {settings.map((setting) => (
                      <MenuItem
                        key={setting}
                        onClick={
                          setting === "Logout"
                            ? handleLogout
                            : setting === "My Orders"
                            ? handleMyOrders
                            : handleCloseUserMenu
                        }
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {setting}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              ) : (
                // 4) If nobody is logged in (guest), show “Sign In”
                !isAdmin && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleLogin}
                    sx={{
                      borderRadius: 20,
                      px: { xs: 2, md: 3 },
                      py: { xs: 0.5, md: 0.8 },
                      fontSize: { xs: "0.8rem", md: "0.9rem" },
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}
                  >
                    Sign In
                  </Button>
                )
              )}
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
