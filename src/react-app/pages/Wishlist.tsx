import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import Navbar from "@/react-app/components/Navbar";
import ProductCard from "@/react-app/components/ProductCard";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import type { Product } from "@/react-app/lib/firestore";
import { getWishlist } from "@/react-app/lib/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      const data = await getWishlist(user.uid);
      setProducts(data);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-100 rounded-xl">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-500">{products.length} items saved</p>
          </div>
        </div>

        {products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center max-w-2xl mx-auto"
          >
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-red-300" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
              Explore our fresh collection and save your favorite items here for later.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
            >
              <ShoppingBag className="w-5 h-5" />
              Start Shopping
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductCard
                    product={product}
                    onAddToWishlist={fetchWishlist}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
