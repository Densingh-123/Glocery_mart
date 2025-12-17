import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/react-app/context/AuthContext";
import Navbar from "@/react-app/components/Navbar";
import ProductCard from "@/react-app/components/ProductCard";
import {
  ShoppingCart,
  Heart,
  Star,
  Package,
  Truck,
  Shield,
  Minus,
  Plus,
} from "lucide-react";
import type { Product, Review } from "@/react-app/lib/firestore";
import { getProduct, getReviews, getProducts, addToCart, addReview } from "@/react-app/lib/firestore";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description"
  );
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const productData = await getProduct(id);
      if (productData) {
        setProduct(productData);

        // Fetch reviews
        const reviewsData = await getReviews(id);
        setReviews(reviewsData);

        // Fetch recommendations (same category)
        const recsData = await getProducts(productData.category, undefined, false);
        setRecommendations(recsData.filter(p => p.id !== id).slice(0, 4));
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!product) return;

    try {
      await addToCart(user.uid, product, quantity);
      navigate("/cart");
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    if (!product) return;

    try {
      await addReview({
        product_id: product.id,
        user_id: user.uid,
        user_name: user.displayName || "Anonymous",
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      setReviewForm({ rating: 5, comment: "" });
      fetchProductDetails();
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Product not found
          </h1>
        </div>
      </div>
    );
  }

  const price = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="relative">
              <img
                src={
                  product.image_url ||
                  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800"
                }
                alt={product.name}
                className="w-full h-[500px] object-cover rounded-xl"
              />
              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg">
                  {product.discount_percentage}% OFF
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              {product.is_bestseller && (
                <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  🏆 Best Seller
                </div>
              )}

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {product.rating && product.rating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-700">
                    {product.rating?.toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    ({product.review_count} reviews)
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-green-600">
                  ₹{price.toFixed(2)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-2xl text-gray-500 line-through">
                      ₹{product.price.toFixed(2)}
                    </span>
                    <span className="text-lg text-green-600 font-semibold">
                      Save ₹{(product.price - price).toFixed(2)}
                    </span>
                  </>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <Package className="w-5 h-5 text-green-600" />
                  <span>
                    {product.stock > 0 ? (
                      <span className="text-green-600 font-semibold">
                        In Stock
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        Out of Stock
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Truck className="w-5 h-5 text-green-600" />
                  <span>Free delivery on orders over ₹50</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>100% quality guaranteed</span>
                </div>
              </div>

              {product.stock > 0 && (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="font-semibold text-gray-900">
                      Quantity:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-semibold">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart - ₹{(price * quantity).toFixed(2)}
                    </button>
                    <button className="p-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                      <Heart className="w-6 h-6 text-gray-700" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-200">
            <div className="flex gap-8 px-8 pt-6">
              <button
                onClick={() => setActiveTab("description")}
                className={`pb-4 font-semibold transition-colors ${activeTab === "description"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`pb-4 font-semibold transition-colors ${activeTab === "reviews"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Reviews ({product.review_count})
              </button>
            </div>

            <div className="p-8">
              {activeTab === "description" ? (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {product.description ||
                      "Fresh, high-quality product sourced from trusted suppliers. Perfect for your daily needs."}
                  </p>
                  {product.is_organic && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <h3 className="text-green-800 font-semibold mb-2">
                        🌿 100% Organic
                      </h3>
                      <p className="text-green-700">
                        This product is certified organic, grown without
                        synthetic pesticides or fertilizers.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {user && (
                    <form
                      onSubmit={handleSubmitReview}
                      className="bg-gray-50 p-6 rounded-xl"
                    >
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Write a Review
                      </h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() =>
                                setReviewForm({ ...reviewForm, rating })
                              }
                              className="p-2"
                            >
                              <Star
                                className={`w-6 h-6 ${rating <= reviewForm.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                                  }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Comment
                        </label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) =>
                            setReviewForm({
                              ...reviewForm,
                              comment: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                          placeholder="Share your experience with this product..."
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Submit Review
                      </button>
                    </form>
                  )}

                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {review.user_name || "Anonymous"}
                              </span>
                              {review.is_verified && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No reviews yet. Be the first to review this product!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((rec) => (
                <ProductCard key={rec.id} product={rec} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
