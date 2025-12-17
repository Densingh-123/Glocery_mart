import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import Navbar from "@/react-app/components/Navbar";
import { Bell, Package, Gift, Check, Info, CheckCheck } from "lucide-react";
import { getNotifications, markNotificationAsRead } from "@/react-app/lib/firestore";
import type { Notification } from "@/shared/types";
import { motion, AnimatePresence } from "framer-motion";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await getNotifications(user.uid);
      setNotifications(data as Notification[]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await markNotificationAsRead(user.uid, id);
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(unreadNotifications.map(n => markNotificationAsRead(user.uid, n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.order_id) {
      navigate(`/orders/${notification.order_id}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Package className="w-6 h-6" />;
      case "offer":
        return <Gift className="w-6 h-6" />;
      default:
        return <Info className="w-6 h-6" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-100 text-blue-600";
      case "offer":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <Bell className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-500 text-sm">You have {unreadCount} unread messages</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No notifications yet
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              We'll let you know when your orders arrive or when we have special offers for you.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-white rounded-xl p-6 cursor-pointer transition-all border ${!notification.is_read
                      ? "border-green-200 shadow-md bg-green-50/30"
                      : "border-gray-100 shadow-sm hover:shadow-md"
                    }`}
                >
                  <div className="flex gap-4">
                    <div className={`p-4 rounded-xl h-fit ${getColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`font-semibold text-lg truncate pr-4 ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {notification.created_at?.seconds
                            ? new Date(notification.created_at.seconds * 1000).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "Just now"}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">{notification.message}</p>

                      <div className="flex items-center justify-between">
                        {!notification.is_read ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1 bg-green-100 px-3 py-1.5 rounded-full transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Mark as read
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" />
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
