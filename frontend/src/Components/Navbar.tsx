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
  const { username, isAuthanticated, logout } = useAuth();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  const navigate = useNavigate();
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  const handleLogin = () => {
    navigate("/login");
  };
  const handleLogout = () => {
    logout();
    navigate("/");
    handleCloseUserMenu();
  };
  const handleCart = () => {
    navigate("/cart");
  };
  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: "primary.main",
        boxShadow: "none",
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundImage: "none",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
            }}
          >
            {/* Logo Section */}
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
                  fontSize: 32,
                  color: "secondary.main",
                  display: { xs: "none", md: "flex" },
                }}
              />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  color: "common.white",
                  transition: "color 0.3s ease",
                  "&:hover": {
                    color: "secondary.main",
                  },
                }}
              >
                LAPTOPIA
              </Typography>
            </Box>

            {/* Mobile Logo */}
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                alignItems: "center",
                gap: 1,
              }}
              onClick={() => navigate("/")}
            >
              <AdbIcon
                sx={{
                  fontSize: 28,
                  color: "secondary.main",
                  display: { xs: "flex", md: "none" },
                }}
              />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  color: "common.white",
                  fontSize: "1.25rem",
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
                gap: 3,
                color: "common.white",
              }}
            >
              {/* Cart Icon */}
              <IconButton
                aria-label="cart"
                onClick={handleCart}
                sx={{
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                  },
                }}
              >
                <Badge
                  badgeContent={cartItem.length}
                  color="secondary"
                  sx={{
                    "& .MuiBadge-badge": {
                      right: -4,
                      top: 8,
                      fontWeight: 600,
                    },
                  }}
                >
                  <ShoppingCartIcon
                    sx={{
                      fontSize: 28,
                      color: "common.white",
                      transition: "color 0.2s ease",
                      "&:hover": {
                        color: "secondary.main",
                      },
                    }}
                  />
                </Badge>
              </IconButton>

              {/* User Section */}
              {isAuthanticated ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Tooltip title="Account settings">
                    <IconButton
                      onClick={handleOpenUserMenu}
                      sx={{
                        p: 0.5,
                        border: "2px solid",
                        borderColor: "common.white",
                        "&:hover": {
                          borderColor: "secondary.main",
                        },
                      }}
                    >
                      <Avatar
                        alt={username || ""}
                        sx={{
                          bgcolor: "secondary.main",
                          width: 36,
                          height: 36,
                          fontSize: "1rem",
                          fontWeight: 600,
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
                        minWidth: 180,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        "& .MuiMenuItem-root": {
                          typography: "body2",
                          fontWeight: 500,
                          py: 1.5,
                          "&:hover": {
                            bgcolor: "action.hover",
                          },
                        },
                      },
                    }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    {settings.map((setting) => (
                      <MenuItem
                        key={setting}
                        onClick={
                          setting === "Logout"
                            ? handleLogout
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
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleLogin}
                  sx={{
                    borderRadius: 20,
                    px: 3,
                    py: 0.8,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                    },
                  }}
                >
                  Sign In
                </Button>
              )}
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default Navbar;
