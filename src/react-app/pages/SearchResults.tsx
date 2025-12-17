import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import ProductCard from "@/react-app/components/ProductCard";
import { getProducts } from "@/react-app/lib/firestore";
import type { Product } from "@/react-app/lib/firestore";
import { Filter, ChevronDown, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("search") || "";
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState("featured");

    // Filters
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const categories = [
        "vegetables", "fruits", "dairy", "bakery", "meat",
        "snacks", "beverages", "household", "personal_care",
        "electronics", "electrical", "home_kitchen", "fashion", "organic"
    ];

    useEffect(() => {
        fetchProducts();
    }, [query]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Fetch all products matching the query first
            const data = await getProducts(undefined, query);
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering
    const filteredProducts = products.filter(product => {
        const price = product.sale_price || product.price;
        const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
        const matchesRating = selectedRating ? (product.rating || 0) >= selectedRating : true;
        const matchesCategory = selectedCategories.length > 0 ? selectedCategories.includes(product.category) : true;

        return matchesPrice && matchesRating && matchesCategory;
    }).sort((a, b) => {
        const priceA = a.sale_price || a.price;
        const priceB = b.sale_price || b.price;

        switch (sortBy) {
            case "price_low": return priceA - priceB;
            case "price_high": return priceB - priceA;
            case "rating": return (b.rating || 0) - (a.rating || 0);
            default: return 0; // Featured/Relevant
        }
    });

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <div className="w-full lg:w-64 flex-shrink-0 space-y-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <Filter className="w-5 h-5 text-green-600" />
                                <h3 className="font-bold text-gray-900">Filters</h3>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-700 mb-3">Price Range</h4>
                                <div className="space-y-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1000"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                        className="w-full accent-green-600"
                                    />
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>₹{priceRange[0]}</span>
                                        <span>₹{priceRange[1]}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-700 mb-3">Categories</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {categories.map(category => (
                                        <label key={category} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(category)}
                                                onChange={() => toggleCategory(category)}
                                                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                            />
                                            <span className="text-gray-600 group-hover:text-green-600 capitalize">
                                                {category.replace('_', ' ')}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Rating */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3">Rating</h4>
                                <div className="space-y-2">
                                    {[4, 3, 2, 1].map(rating => (
                                        <button
                                            key={rating}
                                            onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                                            className={`flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-gray-50 ${selectedRating === rating ? 'bg-green-50 text-green-700' : 'text-gray-600'}`}
                                        >
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm">& Up</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Results for "{query}"
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    {filteredProducts.length} products found
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-gray-600 text-sm">Sort by:</span>
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 cursor-pointer"
                                    >
                                        <option value="featured">Featured</option>
                                        <option value="price_low">Price: Low to High</option>
                                        <option value="price_high">Price: High to Low</option>
                                        <option value="rating">Avg. Customer Review</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl shadow-sm h-80 animate-pulse">
                                        <div className="bg-gray-200 h-48 rounded-t-xl"></div>
                                        <div className="p-4 space-y-3">
                                            <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                                            <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                                            <div className="bg-gray-200 h-8 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            >
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                                <p className="text-gray-600">Try adjusting your filters or search for something else.</p>
                                <button
                                    onClick={() => {
                                        setPriceRange([0, 1000]);
                                        setSelectedRating(null);
                                        setSelectedCategories([]);
                                    }}
                                    className="mt-4 text-green-600 font-medium hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
