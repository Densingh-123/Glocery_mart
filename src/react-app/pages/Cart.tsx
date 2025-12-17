import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import Navbar from "@/react-app/components/Navbar";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import type { CartItem } from "@/react-app/lib/firestore";
import { getCart, updateCartItem, removeFromCart, clearCart as clearCartFirestore } from "@/react-app/lib/firestore";

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      setCartItems(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1 || !user) return;

    try {
      await updateCartItem(user.uid, itemId, quantity);
      fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!user) return;
    try {
      await removeFromCart(user.uid, itemId);
      fetchCart();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to clear your cart?")) return;

    try {
      await clearCartFirestore(user.uid);
      fetchCart();
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.sale_price || item.price;
    return sum + price * item.quantity;
  }, 0);

  const deliveryFee = subtotal >= 50 ? 0 : 3.99;
  const tax = subtotal * 0.085;
  const total = subtotal + deliveryFee + tax;
  const savings = cartItems.reduce((sum, item) => {
    if (item.sale_price && item.sale_price < item.price) {
      return sum + (item.price - item.sale_price) * item.quantity;
    }
    return sum;
  }, 0);

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Shopping Cart ({cartItems.length} items)
          </h1>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added anything to your cart yet
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const price = item.sale_price || item.price;
                const hasDiscount = item.sale_price && item.sale_price < item.price;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-md p-6 flex gap-6 hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={
                        item.image_url ||
                        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200"
                      }
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {item.name}
                      </h3>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg font-bold text-green-600">
                          ₹{price.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="text-sm text-gray-500 line-through">
                            ₹{item.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ₹{(price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Item Total ({cartItems.length} items)</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-700">
                    <span>Delivery Fee</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-green-600 font-semibold">FREE</span>
                      ) : (
                        `₹${deliveryFee.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-700">
                    <span>Taxes & Fees</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>

                  {savings > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Discount</span>
                      <span>-₹{savings.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {savings > 0 && (
                  <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-6 text-sm font-semibold text-center">
                    💚 You saved ₹{savings.toFixed(2)} on this order!
                  </div>
                )}

                {subtotal < 50 && (
                  <div className="bg-blue-50 text-blue-700 p-3 rounded-lg mb-6 text-sm text-center">
                    Add ₹{(50 - subtotal).toFixed(2)} more for FREE delivery!
                  </div>
                )}

                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="mt-4 text-center text-sm text-gray-600">
                  ✓ Safe and Secure Payments
                  <br />✓ Easy Returns & Refunds
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
