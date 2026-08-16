// pages/AdminOrdersPage.tsx
import {
  Box,
  Card,
  CardContent,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { api, errorMessage } from "../api/client";
import { useFeedback } from "../context/Feedback/FeedbackContext";
import StateMessage from "../Components/states/StateMessage";
import {
  AdminOrder,
  ORDER_STATUSES,
  ORDER_STATUS_META,
  OrderStatus,
} from "../types/Order";

const AdminOrdersPage = () => {
  const { showSuccess, showError } = useFeedback();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setOrders(await api.get<AdminOrder[]>("/admin/orders"));
      } catch (err) {
        setError(errorMessage(err, "Failed to load orders"));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    const previous = orders;
    // Optimistic: the dropdown feels instant, and the list is restored if the
    // request turns out to fail.
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status } : o))
    );

    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      showSuccess(`Order marked as ${ORDER_STATUS_META[status].label}`);
    } catch (err) {
      setOrders(previous);
      showError(errorMessage(err, "Could not update the order"));
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 12, md: 14 } }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          All Orders
        </Typography>
        <Typography color="text.secondary">Loading orders…</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 12, md: 14 } }}>
        <StateMessage
          icon="⚠️"
          title="Couldn't load orders"
          description={error}
          actionLabel="Try again"
          onAction={() => window.location.reload()}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 12, md: 14 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        All Orders
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {orders.length} order{orders.length === 1 ? "" : "s"} placed
      </Typography>

      {orders.length === 0 ? (
        <StateMessage
          icon="🧾"
          title="No orders yet"
          description="Customer orders will appear here as soon as they are placed."
        />
      ) : (
        orders.map((order) => (
          <Card key={order._id} sx={{ mb: 3 }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ sm: "flex-start" }}
                spacing={2}
              >
                <Box>
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
                </Box>

                <TextField
                  select
                  size="small"
                  label="Status"
                  value={order.status ?? "processing"}
                  onChange={(e) =>
                    changeStatus(order._id, e.target.value as OrderStatus)
                  }
                  sx={{ minWidth: 160 }}
                >
                  {ORDER_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {ORDER_STATUS_META[status].label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

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
