import { Link, useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { ShoppingCart, Heart, Bell, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { user, redirectToLogin, logout } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCartCount();
      fetchNotificationCount();
      checkAdmin();
    }
  }, [user]);

  const checkAdmin = async () => {
    try {
      const res = await fetch("/api/users/me");
      const data = await res.json();
      setIsAdmin(data.isAdmin || false);
    } catch (error) {
      console.error("Error checking admin:", error);
    }
  };

  const fetchCartCount = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setCartCount(data.length || 0);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      const unread = data.filter((n: any) => !n.is_read).length;
      setNotificationCount(unread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">G</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                GroceryMart
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                Home
              </Link>
              <Link to="/offers" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                Offers
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/wishlist"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Heart className="w-6 h-6 text-gray-700" />
                </Link>

                <Link
                  to="/notifications"
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-6 h-6 text-gray-700" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {notificationCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/cart"
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-6 h-6 text-gray-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {user.google_user_data.picture ? (
                      <img
                        src={user.google_user_data.picture}
                        alt={user.google_user_data.name || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-700" />
                    )}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">
                          {user.google_user_data.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        to="/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Wishlist
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={redirectToLogin}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
