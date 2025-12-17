import { useState, useEffect } from "react";
import Navbar from "@/react-app/components/Navbar";
import ProductCard from "@/react-app/components/ProductCard";
import ChatBot from "@/react-app/components/ChatBot";
import { Search, TrendingUp, Package } from "lucide-react";
import { getProducts } from "@/react-app/lib/firestore";
import type { Product } from "@/react-app/lib/firestore";
import { motion } from "framer-motion";

const categories = [
  { name: "Vegetables", emoji: "🥗", value: "vegetables" },
  { name: "Fruits", emoji: "🍎", value: "fruits" },
  { name: "Dairy", emoji: "🥛", value: "dairy" },
  { name: "Bakery", emoji: "🍞", value: "bakery" },
  { name: "Meat", emoji: "🍖", value: "meat" },
  { name: "Snacks", emoji: "🍫", value: "snacks" },
  { name: "Beverages", emoji: "🧃", value: "beverages" },
  { name: "Household", emoji: "🏠", value: "household" },
  { name: "Personal Care", emoji: "🧴", value: "personal_care" },
  { name: "Electronics", emoji: "📱", value: "electronics" },
  { name: "Electrical", emoji: "🔌", value: "electrical" },
  { name: "Home & Kitchen", emoji: "🍳", value: "home_kitchen" },
  { name: "Fashion", emoji: "👕", value: "fashion" },
  { name: "Organic", emoji: "🌾", value: "organic" },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(
        selectedCategory === "" ? undefined : selectedCategory,
        searchQuery,
        false
      );
      setProducts(data);

      // Featured products
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 to-green-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200')] opacity-20 bg-cover bg-center"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              Fresh Groceries
              <br />
              <span className="text-green-200">Delivered to Your Door</span>
            </h1>
            <p className="text-xl text-green-100 mb-8">
              Shop from 10,000+ products with free delivery on orders over ₹50
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-3 bg-white text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-all shadow-lg hover:shadow-xl">
                Shop Now
              </button>
              <button className="px-8 py-3 bg-green-500 bg-opacity-30 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-opacity-40 transition-all border border-white/30">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for groceries, vegetables, fruits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none shadow-sm hover:shadow-md transition-all"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <div className="mb-12">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"
          >
            <Package className="w-6 h-6 text-green-600" />
            Shop by Category
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category, index) => (
              <motion.button
                key={category.value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.value ? "" : category.value
                  )
                }
                className={`p-4 rounded-xl text-center transition-all ${selectedCategory === category.value
                  ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg"
                  : "bg-white hover:bg-green-50 text-gray-700 shadow-sm hover:shadow-md"
                  }`}
              >
                <div className="text-4xl mb-2">{category.emoji}</div>
                <div className="text-sm font-semibold">{category.name}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* All Products */}
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"
          >
            <TrendingUp className="w-6 h-6 text-green-600" />
            {searchQuery
              ? `Search Results for "${searchQuery}"`
              : selectedCategory
                ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`
                : "All Products"}
          </motion.h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm h-80 animate-pulse"
                >
                  <div className="bg-gray-200 h-48 rounded-t-xl"></div>
                  <div className="p-4 space-y-3">
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                    <div className="bg-gray-200 h-8 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={fetchProducts}
                />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      <ChatBot />

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">GroceryMart</h3>
              <p className="text-gray-400">
                Fresh groceries delivered to your doorstep in 24 hours
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Contact</li>
                <li>Careers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Returns</li>
                <li>Shipping Info</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📞 1-800-GROCERY</li>
                <li>📧 support@grocerymart.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 GroceryMart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
