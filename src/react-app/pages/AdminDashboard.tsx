import { useState, useEffect } from "react";
import Navbar from "@/react-app/components/Navbar";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  X,
  Gift,
} from "lucide-react";
import {
  getProducts,
  getAllOrders,
  getOffers,
  addProduct,
  updateProduct,
  deleteProduct,
  updateOrderStatus,
  createOffer,
  deleteOffer,
  getAdminNotifications,
  markAdminNotificationAsRead,
  type Product,
  type Order,
  type Offer,
} from "@/react-app/lib/firestore";
import { useAuth } from "@/react-app/context/AuthContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    category: "vegetables",
    price: "",
    sale_price: "",
    stock: "",
    image_url: "",
    is_featured: false,
    is_organic: false,
  });

  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    discount_percentage: "",
    coupon_code: "",
    valid_until: "",
  });

  const [offers, setOffers] = useState<Offer[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "offers" | "notifications">("products");
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (user?.email && (user.email.toLowerCase().includes("densingh") || user.email.toLowerCase().includes("admin"))) {
      setIsAdmin(true);
      fetchData();
    } else {
      setIsAdmin(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, ordersData, offersData, notificationsData] = await Promise.all([
        getProducts(),
        getAllOrders(),
        getOffers(),
        getAdminNotifications(),
      ]);

      setProducts(productsData);
      setOrders(ordersData);
      setOffers(offersData);
      setAdminNotifications(notificationsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await markAdminNotificationAsRead(id);
      const updatedNotifications = await getAdminNotifications();
      setAdminNotifications(updatedNotifications);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addProduct({
        ...productForm,
        price: parseFloat(productForm.price),
        sale_price: productForm.sale_price
          ? parseFloat(productForm.sale_price)
          : undefined,
        stock: parseInt(productForm.stock),
        is_bestseller: false,
      });

      setShowProductModal(false);
      setProductForm({
        name: "",
        description: "",
        category: "vegetables",
        price: "",
        sale_price: "",
        stock: "",
        image_url: "",
        is_featured: false,
        is_organic: false,
      });
      fetchData();
      toast.success("Product created successfully");
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      await updateProduct(editingProduct.id, {
        ...productForm,
        price: parseFloat(productForm.price),
        sale_price: productForm.sale_price
          ? parseFloat(productForm.sale_price)
          : undefined,
        stock: parseInt(productForm.stock),
      });

      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
      toast.success("Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteProduct(id);
      fetchData();
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      fetchData();
      toast.success("Order status updated");
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createOffer({
        ...offerForm,
        discount_percentage: offerForm.discount_percentage
          ? parseInt(offerForm.discount_percentage)
          : undefined,
      });

      setShowOfferModal(false);
      setOfferForm({
        title: "",
        description: "",
        discount_percentage: "",
        coupon_code: "",
        valid_until: "",
      });
      fetchData();
      toast.success("Offer created successfully");
    } catch (error) {
      console.error("Error creating offer:", error);
      toast.error("Failed to create offer");
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      await deleteOffer(id);
      fetchData();
      toast.success("Offer deleted successfully");
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast.error("Failed to delete offer");
    }
  };

  const handleSeedProducts = async () => {
    if (!confirm("This will add sample products to the database. Continue?")) return;

    const sampleProducts = [
      { name: "Organic Bananas", category: "fruits", price: 60, stock: 100, image_url: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500", description: "Fresh organic bananas", is_organic: true },
      { name: "Red Apples", category: "fruits", price: 120, sale_price: 100, stock: 50, image_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500", description: "Crisp red apples", is_organic: false },
      { name: "Whole Milk", category: "dairy", price: 50, stock: 200, image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500", description: "Fresh whole milk", is_organic: false },
      { name: "Brown Bread", category: "bakery", price: 40, stock: 30, image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500", description: "Healthy brown bread", is_organic: true },
      { name: "Chicken Breast", category: "meat", price: 250, sale_price: 220, stock: 20, image_url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500", description: "Boneless chicken breast", is_organic: false },
      { name: "Potato Chips", category: "snacks", price: 20, stock: 100, image_url: "https://images.unsplash.com/photo-1566478919030-41567d132720?w=500", description: "Classic salted chips", is_organic: false },
      { name: "Orange Juice", category: "beverages", price: 100, stock: 40, image_url: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500", description: "Freshly squeezed orange juice", is_organic: true },
      { name: "Dish Soap", category: "household", price: 80, stock: 60, image_url: "https://images.unsplash.com/photo-1585837575652-2c90d59096e2?w=500", description: "Lemon scented dish soap", is_organic: false },
      { name: "Shampoo", category: "personal_care", price: 150, stock: 50, image_url: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500", description: "Herbal shampoo", is_organic: true },
      { name: "AA Batteries", category: "electronics", price: 40, stock: 200, image_url: "https://images.unsplash.com/photo-1619641472913-90b48df9926e?w=500", description: "Long lasting batteries", is_organic: false },
      { name: "Spinach", category: "vegetables", price: 30, stock: 40, image_url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500", description: "Fresh green spinach", is_organic: true },
      { name: "Tomatoes", category: "vegetables", price: 40, stock: 80, image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500", description: "Ripe red tomatoes", is_organic: true },
      { name: "Eggs", category: "dairy", price: 60, stock: 100, image_url: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500", description: "Farm fresh eggs", is_organic: false },
      { name: "Chocolate Cake", category: "bakery", price: 300, stock: 10, image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500", description: "Rich chocolate cake", is_organic: false },
      { name: "Green Tea", category: "beverages", price: 120, stock: 50, image_url: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=500", description: "Organic green tea", is_organic: true },
    ];

    try {
      for (const product of sampleProducts) {
        await addProduct({
          ...product,
          is_featured: Math.random() > 0.7,
          is_bestseller: Math.random() > 0.8,
        });
      }
      toast.success("Sample products added successfully!");
      fetchData();
    } catch (error) {
      console.error("Error seeding products:", error);
      toast.error("Failed to seed products");
    }
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      category: product.category,
      price: product.price.toString(),
      sale_price: product.sale_price?.toString() || "",
      stock: product.stock.toString(),
      image_url: product.image_url || "",
      is_featured: product.is_featured,
      is_organic: product.is_organic,
    });
    setShowProductModal(true);
  };

  if (!user || !isAdmin || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: ShoppingBag,
      label: "Total Products",
      value: products.length,
      color: "bg-blue-500",
    },
    {
      icon: Package,
      label: "Total Orders",
      value: orders.length,
      color: "bg-green-500",
    },
    {
      icon: TrendingUp,
      label: "Revenue",
      value: `₹${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}`,
      color: "bg-purple-500",
    },
    {
      icon: Gift,
      label: "Active Offers",
      value: offers.filter((o) => o.is_active).length,
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage products, orders, and offers</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4"
            >
              <div className={`${stat.color} p-4 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">{stat.label}</div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
          {[
            { value: "products", label: "Products" },
            { value: "orders", label: "Orders" },
            { value: "offers", label: "Offers" },
            { value: "notifications", label: "Notifications" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${activeTab === tab.value
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Products</h2>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSeedProducts}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Seed Products
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: "",
                      description: "",
                      category: "vegetables",
                      price: "",
                      sale_price: "",
                      stock: "",
                      image_url: "",
                      is_featured: false,
                      is_organic: false,
                    });
                    setShowProductModal(true);
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Product
                </motion.button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              product.image_url ||
                              "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100"
                            }
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="font-semibold text-gray-900">
                            {product.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 capitalize">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        ₹{product.sale_price || product.price}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-sm font-semibold ${product.stock > 10
                            ? "bg-green-100 text-green-800"
                            : product.stock > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => editProduct(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Orders</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">
                        #{order.order_number}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {order.user_id}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ₹{order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateOrderStatus(order.id, e.target.value)
                          }
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm capitalize"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="packed">Packed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.created_at?.toDate ? order.created_at.toDate().toLocaleDateString() : new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Offers Tab */}
        {activeTab === "offers" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Offers</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowOfferModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Offer
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl shadow-lg p-6 relative group"
                >
                  <button
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-gray-900 mb-2">{offer.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {offer.description}
                  </p>
                  {offer.coupon_code && (
                    <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg font-mono text-sm mb-2 inline-block">
                      {offer.coupon_code}
                    </div>
                  )}
                  {offer.discount_percentage && (
                    <div className="text-lg font-bold text-green-600 mt-2">
                      {offer.discount_percentage}% OFF
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({ ...productForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({ ...productForm, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="dairy">Dairy</option>
                    <option value="bakery">Bakery</option>
                    <option value="meat">Meat</option>
                    <option value="snacks">Snacks</option>
                    <option value="beverages">Beverages</option>
                    <option value="household">Household</option>
                    <option value="personal_care">Personal Care</option>
                    <option value="electronics">Electronics</option>
                    <option value="electrical">Electrical</option>
                    <option value="home_kitchen">Home & Kitchen</option>
                    <option value="fashion">Fashion</option>
                    <option value="organic">Organic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.sale_price}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        sale_price: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) =>
                    setProductForm({ ...productForm, image_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        is_featured: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Featured Product
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={productForm.is_organic}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        is_organic: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Organic
                  </span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Offer</h2>
              <button
                onClick={() => setShowOfferModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  value={offerForm.title}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={offerForm.description}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={offerForm.discount_percentage}
                    onChange={(e) =>
                      setOfferForm({
                        ...offerForm,
                        discount_percentage: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>
                    <div className="space-y-4">
                      {adminNotifications.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
                          No notifications
                        </div>
                      ) : (
                        adminNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`bg-white rounded-xl shadow-md p-6 flex items-start justify-between ${!notification.read ? "border-l-4 border-green-500" : "opacity-75"
                              }`}
                          >
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {notification.title}
                              </h3>
                              <p className="text-gray-600 mb-2">{notification.message}</p>
                              <span className="text-sm text-gray-400">
                                {notification.created_at?.toDate ? notification.created_at.toDate().toLocaleString() : new Date().toLocaleString()}
                              </span>
                            </div>
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkNotificationRead(notification.id)}
                                className="text-sm text-green-600 hover:text-green-700 font-semibold"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    value={offerForm.coupon_code}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, coupon_code: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                    placeholder="SAVE20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={offerForm.valid_until}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, valid_until: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Create Offer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
