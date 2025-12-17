import { useState, useEffect } from "react";
import Navbar from "@/react-app/components/Navbar";
import { Gift, Calendar, Tag, Copy, Check, Percent, Sparkles } from "lucide-react";
import type { Offer, Product } from "@/react-app/lib/firestore";
import { getOffers, getProducts } from "@/react-app/lib/firestore";
import ProductCard from "@/react-app/components/ProductCard";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [offersData, productsData] = await Promise.all([
        getOffers(),
        getProducts()
      ]);

      setOffers(offersData.filter(o => o.is_active));

      // Filter products with discounts
      const deals = productsData.filter(p =>
        p.sale_price && p.sale_price < p.price
      );
      setDiscountedProducts(deals);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Coupon code copied!");
    setTimeout(() => setCopiedCode(null), 2000);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full mb-4 shadow-lg">
            <Gift className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Special Offers & Deals
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Grab the best deals on your favorite groceries. Save more with our exclusive coupons and limited-time discounts!
          </p>
        </motion.div>

        {/* Exclusive Coupons Section */}
        {offers.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Tag className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Exclusive Coupons</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 group"
                >
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Percent className="w-24 h-24" />
                    </div>

                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Limited Time
                      </div>
                      {offer.discount_percentage && (
                        <div className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                          {offer.discount_percentage}% OFF
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-2 relative z-10">{offer.title}</h3>
                    {offer.description && (
                      <p className="text-green-50 text-sm relative z-10">{offer.description}</p>
                    )}
                  </div>

                  <div className="p-6">
                    {offer.coupon_code && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Coupon Code</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-50 border border-dashed border-gray-300 px-4 py-3 rounded-lg font-mono font-bold text-green-700 text-lg text-center tracking-wider">
                            {offer.coupon_code}
                          </div>
                          <button
                            onClick={() => copyCode(offer.coupon_code!)}
                            className="p-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors border border-green-200"
                            title="Copy Code"
                          >
                            {copiedCode === offer.coupon_code ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {offer.valid_until && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          Valid till{" "}
                          <span className="font-semibold text-gray-700">
                            {new Date(offer.valid_until).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Deal of the Day Section */}
        {discountedProducts.length > 0 ? (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-red-500 p-2 rounded-lg">
                <Percent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Deal of the Day</h2>
                <p className="text-gray-500">Huge savings on these hand-picked items</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {discountedProducts.map((product) => (
                <div key={product.id} className="h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No product deals at the moment</h3>
            <p className="text-gray-500">Check back later for price drops on your favorite items!</p>
          </div>
        )}
      </div>
    </div>
  );
}
