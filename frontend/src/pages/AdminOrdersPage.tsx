// pages/AdminOrdersPage.tsx
import { Box, Card, CardContent, Container, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { api, errorMessage } from "../api/client";
import { AdminOrder } from "../types/Order";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setOrders(await api.get<AdminOrder[]>("/admin/orders"));
      } catch (err) {
        setError(errorMessage(err, "Failed to load orders"));
      }
    })();
  }, []);

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 10 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <Typography variant="h4" gutterBottom>
        All Confirmed Orders (Admin View)
      </Typography>

      {orders.length === 0 ? (
        <Typography>No orders found.</Typography>
      ) : (
        orders.map((order) => (
          <Card key={order._id} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6">Order #{order._id}</Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                {/* userId is null when the customer's account was deleted. */}
                {order.userId
                  ? `By: ${order.userId.firstName} ${order.userId.lastName} (${order.userId.email})`
                  : "By: deleted account"}
                {order.createdAt &&
                  ` · ${new Date(order.createdAt).toLocaleString()}`}
              </Typography>
              <Typography>Total: ${order.total.toFixed(2)}</Typography>
              <Typography>Shipping to: {order.address}</Typography>
              {order.payment?.last4 && (
                <Typography variant="body2" color="text.secondary">
                  Paid with {order.payment.brand ?? "card"} ••••{" "}
                  {order.payment.last4}
                </Typography>
              )}

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Items:</Typography>
                {order.orderItems.map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mt: 1,
                    }}
                  >
                    <Box
                      component="img"
                      src={item.productImage}
                      alt={item.productTitle}
                      sx={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 1,
                      }}
                    />
                    <Box>
                      <Typography>{item.productTitle}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Container>
  );
};

export default AdminOrdersPage;
