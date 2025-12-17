import { Link, useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import { getNotifications } from "@/react-app/lib/firestore";
import { ShoppingCart, Heart, Bell, User, LogOut, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, logout } = useAuth();
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
    if (user?.email && (user.email.toLowerCase().includes("densingh") || user.email.toLowerCase().includes("admin"))) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const fetchCartCount = async () => {
    // TODO: Implement fetchCartCount using Firestore
    setCartCount(0);
  };

  const fetchNotificationCount = async () => {
    if (user) {
      const notifications = await getNotifications(user.uid);
      const unreadCount = notifications.filter((n: any) => !n.read).length;
      setNotificationCount(unreadCount);
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
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 10 }}
                className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <span className="text-white text-xl font-bold">G</span>
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                GroceryMart
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-700 hover:text-green-600 font-medium transition-colors relative group">
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
              </Link>
              <Link to="/offers" className="text-gray-700 hover:text-green-600 font-medium transition-colors relative group">
                Offers
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-gray-700 hover:text-green-600 font-medium transition-colors relative group">
                  Admin
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
                </Link>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
                onChange={(e) => {
                  const query = e.target.value;
                  if (query) {
                    navigate(`/search?search=${encodeURIComponent(query)}`);
                  } else {
                    navigate('/');
                  }
                }}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/wishlist"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Heart className="w-6 h-6 text-gray-700" />
                  </motion.div>
                </Link>

                <Link
                  to="/notifications"
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Bell className="w-6 h-6 text-gray-700" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {notificationCount}
                      </span>
                    )}
                  </motion.div>
                </Link>

                <Link
                  to="/cart"
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <ShoppingCart className="w-6 h-6 text-gray-700" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {cartCount}
                      </span>
                    )}
                  </motion.div>
                </Link>

                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-700" />
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-200"
                      >
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">
                            {user.displayName || "User"}
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/login")}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
              >
                Sign In
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </nav >
  );
}
