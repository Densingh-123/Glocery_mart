import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import Navbar from "@/react-app/components/Navbar";
import { MapPin, CreditCard, CheckCircle } from "lucide-react";
import type { CartItem } from "@/react-app/lib/firestore";
import { getCart, createOrder, clearCart } from "@/react-app/lib/firestore";

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    paymentMethod: "card",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    try {
      const data = await getCart(user.uid);
      if (data.length === 0) {
        navigate("/cart");
        return;
      }
      setCartItems(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.sale_price || item.price;
    return sum + price * item.quantity;
  }, 0);

  const deliveryFee = subtotal >= 50 ? 0 : 3.99;
  const tax = subtotal * 0.085;
  const total = subtotal + deliveryFee + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      const deliveryAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`;

      const orderData = {
        delivery_address: deliveryAddress,
        delivery_slot: "Tomorrow, 10:00 AM - 12:00 PM",
        payment_method: formData.paymentMethod,
        total: total
      };

      const orderId = await createOrder(user.uid, orderData, cartItems);
      await clearCart(user.uid);
      navigate(`/orders/${orderId}`);
    } catch (error) {
      console.error("Error placing order:", error);
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-600 text-white">
              1
            </div>
            <span className="font-semibold text-gray-700">Address</span>
          </div>
          <div className="w-16 h-1 bg-green-600"></div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-600 text-white">
              2
            </div>
            <span className="font-semibold text-gray-700">Payment</span>
          </div>
          <div className="w-16 h-1 bg-green-600"></div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-600 text-white">
              3
            </div>
            <span className="font-semibold text-gray-700">Review</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Delivery Address
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                      placeholder="123 Main Street, Apt 4B"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.zipCode}
                        onChange={(e) =>
                          setFormData({ ...formData, zipCode: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Payment Method
                  </h2>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={formData.paymentMethod === "card"}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentMethod: e.target.value })
                      }
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        Credit/Debit Card
                      </div>
                      <div className="text-sm text-gray-600">
                        Safe and secure payments
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={formData.paymentMethod === "upi"}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentMethod: e.target.value })
                      }
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">UPI Payment</div>
                      <div className="text-sm text-gray-600">
                        Google Pay, PhonePe, Paytm
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentMethod: e.target.value })
                      }
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        Cash on Delivery
                      </div>
                      <div className="text-sm text-gray-600">
                        Pay when you receive
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  {cartItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={
                          item.image_url ||
                          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100"
                        }
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          ₹{((item.sale_price || item.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {cartItems.length > 3 && (
                    <div className="text-sm text-gray-600 text-center">
                      +{cartItems.length - 3} more items
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2 mb-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-green-600 font-semibold">FREE</span>
                      ) : (
                        `₹${deliveryFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Tax</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    "Processing..."
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
