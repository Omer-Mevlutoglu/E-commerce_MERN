// pages/AdminOrdersPage.tsx
import { Box, Card, CardContent, Container, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "../context/Auth/AuthContext";

interface OrderItem {
  productTtile: string;
  productImage: string;
  unitprice: number;
  quantity: number;
}

interface Order {
  _id: string;
  orderItems: OrderItem[];
  total: number;
  address: string;
  fullName: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const BASE_URL = import.meta.env.VITE_BASE_URL;

const AdminOrdersPage = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${BASE_URL}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error("Failed to load orders");
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    fetchOrders();
  }, [token]);

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
                By: {order.userId.firstName} {order.userId.lastName} (
                {order.userId.email})
              </Typography>
              <Typography>Total: ${order.total.toFixed(2)}</Typography>
              <Typography>Shipping to: {order.address}</Typography>

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
                      alt={item.productTtile}
                      sx={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 1,
                      }}
                    />
                    <Box>
                      <Typography>{item.productTtile}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.quantity} × ${item.unitprice.toFixed(2)}
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
