import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import Navbar from "@/react-app/components/Navbar";
import {
  CheckCircle,
  MapPin,
  CreditCard,
  ArrowLeft,
  Clock,
} from "lucide-react";

export default function OrderDetail() {
  const { id } = useParams();
  const { user, redirectToLogin } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      redirectToLogin();
      return;
    }
    fetchOrder();
  }, [id, user]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = (status: string) => {
    const steps = ["confirmed", "packed", "shipped", "delivered"];
    const currentIndex = steps.indexOf(status);
    return steps.map((step, index) => ({
      name: step,
      completed: index <= currentIndex,
    }));
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </Link>

        {/* Order Success Banner */}
        {order.status === "delivered" && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-8 mb-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Order Delivered!</h1>
            <p className="text-green-100">
              Your order was delivered on{" "}
              {new Date(order.delivered_at || order.updated_at).toLocaleDateString(
                "en-IN"
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Tracking */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Tracking
              </h2>

              <div className="relative">
                {statusSteps.map((step, index) => (
                  <div key={step.name} className="flex gap-4 mb-8 last:mb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step.completed
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        )}
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`w-0.5 h-16 ${
                            step.completed ? "bg-green-600" : "bg-gray-200"
                          }`}
                        ></div>
                      )}
                    </div>

                    <div className="flex-1 pb-8">
                      <div className="font-semibold text-gray-900 capitalize">
                        {step.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {step.completed
                          ? step.name === order.status
                            ? "Current status"
                            : "Completed"
                          : "Pending"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Items ({order.items?.length || 0})
              </h2>

              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                  >
                    <img
                      src={
                        item.product_image ||
                        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200"
                      }
                      alt={item.product_name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.product_name}
                      </h3>
                      <div className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Order Information
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Order Number</div>
                  <div className="font-semibold text-gray-900">
                    #{order.order_number}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Order Date</div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 capitalize">
                    {order.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900">Delivery Address</h3>
              </div>
              <p className="text-gray-700">{order.delivery_address}</p>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900">Payment</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className="font-semibold text-green-600">
                    {order.payment_status === "paid" ? "✓ Paid" : "Pending"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Bill Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Fee</span>
                  <span>₹{order.delivery_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax</span>
                  <span>₹{order.tax.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
