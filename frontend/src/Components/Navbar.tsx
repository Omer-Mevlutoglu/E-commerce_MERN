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

export default function Navbar() {
  const { cartItem } = useCart();
  const { username, isAuthenticated, isAdmin, logout } = useAuth();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  const navigate = useNavigate();

  const handleOpenUserMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorElUser(e.currentTarget);
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
  const handleAddProducts = () => navigate("/admin/products/add");
  const handleManageProducts = () => navigate("/admin/products/list");
  const handleViewOrders = () => navigate("/admin/orders");

  return (
    <AppBar
      position="fixed"
      sx={{
        top: 0,
        left: 0,
        right: 0,
        bgcolor: "rgba(0, 0, 0, 0.22)",
        backdropFilter: "blur(12px)",
        boxShadow: "none",
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{
            display: "flex",
            justifyContent: "space-between",
            py: { xs: 0.5, md: 1 },
            px: { xs: 1, sm: 0 },
          }}
        >
          {/* Logo */}
          <Box
            onClick={() => navigate("/")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              transition: "color 0.3s ease",
              "&:hover": { color: "orange" },
            }}
          >
            <AdbIcon
              sx={{
                fontSize: { xs: 26, md: 32 },
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
                "&:hover": { color: "orange" },
              }}
            >
              LAPTOPIA
            </Typography>
          </Box>

          {/* Actions */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2, md: 3 },
            }}
          >
            {/* User Cart (users only) */}
            {!isAdmin && isAuthenticated && (
              <IconButton
                aria-label="cart"
                onClick={handleCart}
                sx={{
                  color: "common.white",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                <Badge badgeContent={cartItem.length} color="secondary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            )}

            {/* Admin Links */}
            {isAuthenticated && isAdmin && (
              <>
                <Button color="inherit" onClick={handleAddProducts}>
                  Add Product
                </Button>
                <Button color="inherit" onClick={handleManageProducts}>
                  Products
                </Button>
                <Button color="inherit" onClick={handleViewOrders}>
                  Orders
                </Button>
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}

            {/* User Menu */}
            {!isAdmin && isAuthenticated ? (
              <Box>
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
                      sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}
                    >
                      {username?.[0].toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorElUser}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  PaperProps={{ sx: { mt: 1, minWidth: 140 } }}
                >
                  {settings.map((setting) => (
                    <MenuItem
                      key={setting}
                      onClick={
                        setting === "Logout" ? handleLogout : handleMyOrders
                      }
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {setting}
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            ) : (
              // Guest Sign In
              !isAdmin && (
                <Button
                  variant="outlined"
                  // color="primary"
                  onClick={handleLogin}
                  sx={{
                    borderRadius: 20,
                    px: 2.5,
                    py: 0.7,
                    fontWeight: 600,
                    color: "white",
                  }}
                >
                  Sign In
                </Button>
              )
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
