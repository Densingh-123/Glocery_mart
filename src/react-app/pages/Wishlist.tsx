import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import Navbar from "@/react-app/components/Navbar";
import ProductCard from "@/react-app/components/ProductCard";
import { Heart } from "lucide-react";
import type { Product } from "@/react-app/lib/firestore";
import { getWishlist } from "@/react-app/lib/firestore";

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          My Wishlist ({products.length} items)
        </h1>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600">
              Start adding items you love to your wishlist
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToWishlist={fetchWishlist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
