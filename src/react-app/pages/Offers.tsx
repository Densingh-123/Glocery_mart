import { useState, useEffect } from "react";
import Navbar from "@/react-app/components/Navbar";
import { Gift, Calendar, Tag, Copy, Check } from "lucide-react";
import type { Offer } from "@/shared/types";

export default function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch("/api/offers");
      const data = await res.json();
      setOffers(data);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full mb-4">
            <Gift className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Special Offers & Deals
          </h1>
          <p className="text-xl text-gray-600">
            Save more with our exclusive offers and coupon codes
          </p>
        </div>

        {offers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No active offers right now
            </h2>
            <p className="text-gray-600">
              Check back soon for amazing deals and discounts!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-500"
              >
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Tag className="w-6 h-6" />
                    {offer.discount_percentage && (
                      <div className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                        {offer.discount_percentage}% OFF
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{offer.title}</h3>
                  {offer.description && (
                    <p className="text-green-100 text-sm">{offer.description}</p>
                  )}
                </div>

                <div className="p-6">
                  {offer.coupon_code && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">Coupon Code</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 px-4 py-3 rounded-lg font-mono font-bold text-green-600 text-lg">
                          {offer.coupon_code}
                        </div>
                        <button
                          onClick={() => copyCode(offer.coupon_code!)}
                          className="p-3 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                        >
                          {copiedCode === offer.coupon_code ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-green-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {(offer.valid_from || offer.valid_until) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Valid till{" "}
                        {offer.valid_until
                          ? new Date(offer.valid_until).toLocaleDateString("en-IN")
                          : "further notice"}
                      </span>
                    </div>
                  )}

                  <button className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg">
                    Shop Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
