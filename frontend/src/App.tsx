// App.tsx
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";

import HomeGuard from "./Components/HomeGuard";
import RequireUser from "./Components/RequireUser";
import AdminRoute from "./Components/AdminRoute";

import AuthProvider from "./context/Auth/AuthProvider";
import CartProvider from "./context/Cart/CartProvider";
import FeedbackProvider from "./context/Feedback/FeedbackProvider";

// Eager: on the critical path for a first-time visitor.
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";

// Lazy: a shopper never opens the admin screens, and the checkout flow is only
// reached after a deliberate action — so neither belongs in the initial bundle.
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderConfirmationPage = lazy(
  () => import("./pages/OrderConfirmationPage")
);
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const AdminAddProductPage = lazy(() => import("./pages/AdminAddProductPage"));
const AdminEditProductPage = lazy(() => import("./pages/AdminEditProductPage"));
const AdminProductListPage = lazy(() => import("./pages/AdminProductListPage"));
const AdminOrdersPage = lazy(() => import("./pages/AdminOrdersPage"));

const RouteFallback = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "60vh",
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <FeedbackProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Navbar />

            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* 1) Home (redirects admins away) */}
                <Route path="/" element={<HomeGuard />} />

                {/* 2) Public catalogue */}
                <Route path="/products" element={<ProductsPage />} />
                <Route
                  path="/products/:productId"
                  element={<ProductDetailPage />}
                />

                {/* 3) Public auth routes */}
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* 4) User-only routes */}
                <Route element={<RequireUser />}>
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/my-orders" element={<MyOrdersPage />} />
                  <Route
                    path="/order-confirmation"
                    element={<OrderConfirmationPage />}
                  />
                </Route>

                {/* 5) Admin-only routes */}
                <Route element={<AdminRoute />}>
                  <Route
                    path="/admin/products/add"
                    element={<AdminAddProductPage />}
                  />
                  <Route
                    path="/admin/products/edit/:productId"
                    element={<AdminEditProductPage />}
                  />
                  <Route
                    path="/admin/products/list"
                    element={<AdminProductListPage />}
                  />
                  <Route path="/admin/orders" element={<AdminOrdersPage />} />
                </Route>

                {/* 6) Anything else gets a real 404, not a silent redirect. */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>

            <Footer />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </FeedbackProvider>
  );
}

export default App;
