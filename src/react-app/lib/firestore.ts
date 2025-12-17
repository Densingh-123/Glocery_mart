import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

// Types
export interface Product {
    id: string;
    name: string;
    description: string;
    category: string;
    subcategory?: string;
    price: number;
    sale_price?: number;
    discount_percentage?: number;
    stock: number;
    image_url: string;
    is_featured: boolean;
    is_bestseller: boolean;
    is_organic: boolean;
    rating?: number;
    review_count?: number;
    created_at?: any;
    updated_at?: any;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Order {
    id: string;
    order_number: string;
    user_id: string;
    status: string;
    total: number;
    created_at: any;
    items: any[];
    delivery_address?: string;
    payment_method?: string;
}

// Products
export const getProducts = async (category?: string, search?: string, featured?: boolean) => {
    let q = query(collection(db, "products"));

    if (category) {
        q = query(q, where("category", "==", category));
    }

    if (featured) {
        q = query(q, where("is_featured", "==", true));
    }

    // Note: Firestore doesn't support simple text search like SQL LIKE. 
    // For production, use Algolia or Typesense. 
    // Here we'll filter client-side for search if needed, or rely on exact matches.

    const snapshot = await getDocs(q);
    let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

    // Sort client-side to avoid Firestore index requirements
    products.sort((a, b) => {
        const dateA = a.created_at?.toMillis?.() || 0;
        const dateB = b.created_at?.toMillis?.() || 0;
        return dateB - dateA;
    });

    if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter(p =>
            p.name.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower)
        );
    }

    return products;
};

export const getProduct = async (id: string) => {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
};

export const addProduct = async (product: Omit<Product, "id" | "created_at" | "updated_at">) => {
    await addDoc(collection(db, "products"), {
        ...product,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
    });
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, {
        ...product,
        updated_at: serverTimestamp()
    });
};

export const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, "products", id));
};

// Cart
export const getCart = async (userId: string) => {
    const q = query(collection(db, `users/${userId}/cart`), orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CartItem));
};

export const addToCart = async (userId: string, product: Product, quantity: number = 1) => {
    const cartRef = collection(db, `users/${userId}/cart`);
    const q = query(cartRef, where("product_id", "==", product.id));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        const currentQty = snapshot.docs[0].data().quantity;
        await updateDoc(doc(cartRef, docId), {
            quantity: currentQty + quantity,
            updated_at: serverTimestamp()
        });
    } else {
        await addDoc(cartRef, {
            product_id: product.id,
            name: product.name,
            price: product.price,
            sale_price: product.sale_price,
            image_url: product.image_url,
            quantity,
            created_at: serverTimestamp()
        });
    }
};

export const updateCartItem = async (userId: string, itemId: string, quantity: number) => {
    const docRef = doc(db, `users/${userId}/cart`, itemId);
    await updateDoc(docRef, { quantity, updated_at: serverTimestamp() });
};

export const removeFromCart = async (userId: string, itemId: string) => {
    await deleteDoc(doc(db, `users/${userId}/cart`, itemId));
};

export const clearCart = async (userId: string) => {
    const cartItems = await getCart(userId);
    const promises = cartItems.map(item => deleteDoc(doc(db, `users/${userId}/cart`, item.id)));
    await Promise.all(promises);
};

// Admin Notifications
export const createAdminNotification = async (title: string, message: string, type: "order" | "system" = "order") => {
    await addDoc(collection(db, "admin_notifications"), {
        title,
        message,
        type,
        read: false,
        is_read: false,
        created_at: serverTimestamp()
    });
};

// Orders
export const createOrder = async (userId: string, userName: string, orderData: any, cartItems: any[]) => {
    const orderRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        user_id: userId,
        user_name: userName,
        created_at: serverTimestamp(),
        status: "confirmed",
        items: cartItems
    });

    await clearCart(userId);

    // Notify Admin
    await createAdminNotification(
        "New Order Placed",
        `Order #${orderData.order_number || orderRef.id.slice(0, 6)} has been placed by user ${userName}. Total: ₹${orderData.total}`,
        "order"
    );

    return orderRef.id;
};

export const getOrders = async (userId: string) => {
    const q = query(collection(db, "orders"), where("user_id", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Order))
        .sort((a, b) => {
            const dateA = a.created_at?.seconds || 0;
            const dateB = b.created_at?.seconds || 0;
            return dateB - dateA;
        });
};

export const getOrder = async (orderId: string) => {
    const docRef = doc(db, "orders", orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
    }
    return null;
};

export const updateOrderStatus = async (orderId: string, status: string) => {
    const docRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(docRef);

    if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        await updateDoc(docRef, { status });

        // Notify User
        await createNotification(
            orderData.user_id,
            "Order Status Updated",
            `Your order #${orderData.order_number || orderId.slice(0, 6)} is now ${status}.`,
            "order",
            orderId
        );
    }
};

export const getAllOrders = async () => {
    const q = query(collection(db, "orders"), orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

// Reviews
export interface Review {
    id: string;
    product_id: string;
    user_id: string;
    user_name: string;
    rating: number;
    comment: string;
    is_verified: boolean;
    created_at: any;
}

export const getReviews = async (productId: string) => {
    const q = query(collection(db, "reviews"), where("product_id", "==", productId));
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));

    // Sort client-side
    reviews.sort((a, b) => {
        const dateA = a.created_at?.toMillis?.() || 0;
        const dateB = b.created_at?.toMillis?.() || 0;
        return dateB - dateA;
    });

    return reviews;
};

export const addReview = async (review: Omit<Review, "id" | "created_at" | "is_verified">) => {
    await addDoc(collection(db, "reviews"), {
        ...review,
        is_verified: true,
        created_at: serverTimestamp()
    });
};

// Offers
export interface Offer {
    id: string;
    title: string;
    description: string;
    discount_percentage?: number;
    coupon_code?: string;
    valid_until?: string;
    is_active: boolean;
    created_at: any;
}

export const getOffers = async () => {
    const q = query(collection(db, "offers"), orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
};

export const createOffer = async (offer: Omit<Offer, "id" | "created_at" | "is_active">) => {
    await addDoc(collection(db, "offers"), {
        ...offer,
        is_active: true,
        created_at: serverTimestamp()
    });
};

export const deleteOffer = async (id: string) => {
    await deleteDoc(doc(db, "offers", id));
};

// Notifications
export const createNotification = async (userId: string, title: string, message: string, type: "order" | "system" | "promo" = "system", orderId?: string) => {
    await addDoc(collection(db, `users/${userId}/notifications`), {
        title,
        message,
        type,
        read: false,
        is_read: false,
        order_id: orderId || null,
        created_at: serverTimestamp()
    });
};

export const getNotifications = async (userId: string) => {
    const q = query(collection(db, `users/${userId}/notifications`), orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
    const docRef = doc(db, `users/${userId}/notifications`, notificationId);
    await updateDoc(docRef, {
        read: true,
        is_read: true // handling both naming conventions just in case
    });
};

export const getAdminNotifications = async () => {
    const q = query(collection(db, "admin_notifications"), orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const markAdminNotificationAsRead = async (notificationId: string) => {
    const docRef = doc(db, "admin_notifications", notificationId);
    await updateDoc(docRef, {
        read: true,
        is_read: true
    });
};

// Wishlist
export const addToWishlist = async (userId: string, product: Product) => {
    const wishlistRef = collection(db, `users/${userId}/wishlist`);
    const q = query(wishlistRef, where("product_id", "==", product.id));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        await addDoc(wishlistRef, {
            product_id: product.id,
            ...product,
            created_at: serverTimestamp()
        });
    }
};

export const removeFromWishlist = async (userId: string, productId: string) => {
    const wishlistRef = collection(db, `users/${userId}/wishlist`);
    const q = query(wishlistRef, where("product_id", "==", productId));
    const snapshot = await getDocs(q);

    snapshot.docs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
    });
};

export const getWishlist = async (userId: string) => {
    const q = query(collection(db, `users/${userId}/wishlist`), orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const checkWishlistStatus = async (userId: string, productId: string) => {
    const wishlistRef = collection(db, `users/${userId}/wishlist`);
    const q = query(wishlistRef, where("product_id", "==", productId));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
};
