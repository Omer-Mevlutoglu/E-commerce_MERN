// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Components/Navbar";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import MyOrdersPage from "./pages/MyOrdersPage";

import AdminRoute from "./Components/AdminRoute";
import AdminAddProductPage from "./pages/AdminAddProductPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";

import AuthProvider from "./context/Auth/AuthProvider";
import CartProvider from "./context/Cart/CartProvider";
import RequireUser from "./Components/RequireUser";
import HomeGuard from "./Components/HomeGuard";
import AdminProductListPage from "./pages/AdminProductListPage";
import Footer from "./Components/Footer";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />

          <Routes>
            {/* 1) Home (redirects admins away) */}
            <Route path="/" element={<HomeGuard />} />

            {/* 2) Public auth routes */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* 3) User‐only routes */}
            <Route element={<RequireUser />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route
                path="/order-confirmation"
                element={<OrderConfirmationPage />}
              />
            </Route>

            {/* 4) Admin‐only routes */}
            <Route element={<AdminRoute />}>
              <Route
                path="/admin/products/add"
                element={<AdminAddProductPage />}
              />
              <Route
                path="/admin/products/list"
                element={<AdminProductListPage />}
              />{" "}
              {/* new */}
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
            </Route>

            {/* 5) Catch‐all: redirect unknown URLs back to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Footer/>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
