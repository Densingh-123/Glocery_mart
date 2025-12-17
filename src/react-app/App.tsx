import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import ProductDetailPage from "@/react-app/pages/ProductDetail";
import CartPage from "@/react-app/pages/Cart";
import CheckoutPage from "@/react-app/pages/Checkout";
import OrdersPage from "@/react-app/pages/Orders";
import OrderDetailPage from "@/react-app/pages/OrderDetail";
import WishlistPage from "@/react-app/pages/Wishlist";
import OffersPage from "@/react-app/pages/Offers";
import AdminDashboard from "@/react-app/pages/AdminDashboard";
import NotificationsPage from "@/react-app/pages/Notifications";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
