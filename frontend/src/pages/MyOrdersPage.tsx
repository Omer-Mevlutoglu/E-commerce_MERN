/* eslint-disable @typescript-eslint/no-explicit-any */
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Box, Card, CardContent, CardMedia, Grid2 } from "@mui/material";
import { useAuth } from "../context/Auth/AuthContext";
import { useEffect } from "react";

const MyOrdersPage = () => {
  const { getMyOrders, myOrders } = useAuth();

  useEffect(() => {
    getMyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        align="center"
        sx={{ fontWeight: 700, mb: 4 }}
      >
        My Orders
      </Typography>

      {myOrders && myOrders.length > 0 ? (
        <Grid2 container spacing={4}>
          {myOrders.map((order: any) => (
            <Grid2 size={{ xs: 12, md: 6 }} key={order._id}>
              <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Order #{order._id}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Shipping Address: {order.address}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Total: ${order.total.toFixed(2)}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Items:
                    </Typography>
                    {order.orderItems && order.orderItems.length > 0 ? (
                      order.orderItems.map((item: any) => (
                        <Box
                          key={item.productTtile}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <CardMedia
                            component="img"
                            image={item.productImage}
                            alt={item.productTtile}
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: 1,
                              mr: 1,
                            }}
                          />
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {item.productTtile}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.quantity} x ${item.unitprice}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No items in this order.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      ) : (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="body1">
            You have not placed any orders yet.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default MyOrdersPage;
