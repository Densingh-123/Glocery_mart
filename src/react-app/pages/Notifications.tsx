import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import Navbar from "@/react-app/components/Navbar";
import { Bell, Package, Gift, Check, Info } from "lucide-react";
import { getNotifications, markNotificationAsRead } from "@/react-app/lib/firestore";
import type { Notification } from "@/shared/types";

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
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
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
        return <Package className="w-5 h-5" />;
      case "offer":
        return <Gift className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-100 text-blue-600";
      case "offer":
        return "bg-yellow-100 text-yellow-600";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <Bell className="w-8 h-8 text-green-600" />
          Notifications
        </h1>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No notifications yet
            </h2>
            <p className="text-gray-600">
              You'll see updates about your orders and offers here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition-all ${notification.is_read === 0
                  ? "border-l-4 border-green-500"
                  : "opacity-75"
                  }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`p-3 rounded-lg ${getColor(notification.type)}`}
                  >
                    {getIcon(notification.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      {notification.is_read === 0 && (
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                    </div>

                    <p className="text-gray-700 mb-2">{notification.message}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>

                      {notification.is_read === 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
