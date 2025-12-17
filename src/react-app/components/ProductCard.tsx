import { useNavigate } from "react-router";
import { Link } from "react-router";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product } from "@/react-app/lib/firestore";
import { addToCart, addToWishlist, removeFromWishlist, checkWishlistStatus } from "@/react-app/lib/firestore";
import { useAuth } from "@/react-app/context/AuthContext";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  onAddToWishlist?: () => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
}: ProductCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const price = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    setIsAdding(true);

    try {
      await addToCart(user.uid, product, 1);
      onAddToCart?.();
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkStatus();
    }
  }, [user, product.id]);

  const checkStatus = async () => {
    if (user) {
      const status = await checkWishlistStatus(user.uid, product.id);
      setIsWishlisted(status);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    // Optimistic update
    const newStatus = !isWishlisted;
    setIsWishlisted(newStatus);

    try {
      if (newStatus) {
        await addToWishlist(user.uid, product);
      } else {
        await removeFromWishlist(user.uid, product.id);
      }
      onAddToWishlist?.();
    } catch (error) {
      console.error("Error updating wishlist:", error);
      setIsWishlisted(!newStatus); // Revert on error
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        to={`/products/${product.id}`}
        className="group block bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-200 h-full flex flex-col"
      >
        <div className="relative overflow-hidden bg-gray-50 aspect-[4/3]">
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-md z-10">
              {product.discount_percentage}% OFF
            </div>
          )}

          {product.is_organic && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md z-10">
              Organic
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleWishlist}
            className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
          >
            <Heart
              className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
                }`}
            />
          </motion.button>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-green-600 transition-colors">
            {product.name}
          </h3>

          {product.rating && product.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-700">
                {product.rating?.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">
                ({product.review_count})
              </span>
            </div>
          )}

          <div className="mt-auto pt-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl font-bold text-green-600">
                ₹{price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{product.price.toFixed(2)}
                </span>
              )}
            </div>

            {product.stock > 0 ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={isAdding}
                className="w-full py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <ShoppingCart className="w-4 h-4" />
                {isAdding ? "Adding..." : "Add to Cart"}
              </motion.button>
            ) : (
              <div className="w-full py-2 bg-gray-200 text-gray-500 rounded-lg font-semibold text-center">
                Out of Stock
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
