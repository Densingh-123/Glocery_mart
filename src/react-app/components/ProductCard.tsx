import { Link } from "react-router";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/shared/types";

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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const price = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });

      if (res.ok) {
        onAddToCart?.();
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isWishlisted) {
        await fetch(`/api/wishlist/${product.id}`, { method: "DELETE" });
        setIsWishlisted(false);
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: product.id }),
        });
        setIsWishlisted(true);
      }
      onAddToWishlist?.();
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-200"
    >
      <div className="relative overflow-hidden bg-gray-50">
        <img
          src={product.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-md">
            {product.discount_percentage}% OFF
          </div>
        )}

        {product.is_organic === 1 && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
            Organic
          </div>
        )}

        <button
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-all"
        >
          <Heart
            className={`w-5 h-5 ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
            }`}
          />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-green-600 transition-colors">
          {product.name}
        </h3>

        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-700">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">
              ({product.review_count})
            </span>
          </div>
        )}

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
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <ShoppingCart className="w-4 h-4" />
            {isAdding ? "Adding..." : "Add to Cart"}
          </button>
        ) : (
          <div className="w-full py-2 bg-gray-200 text-gray-500 rounded-lg font-semibold text-center">
            Out of Stock
          </div>
        )}
      </div>
    </Link>
  );
}
