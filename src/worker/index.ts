import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  authMiddleware,
  getOAuthRedirectUrl,
  exchangeCodeForSessionToken,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import type { MochaUser } from "@getmocha/users-service/shared";
import {
  CreateProductSchema,
  UpdateProductSchema,
  AddToCartSchema,
  CreateOrderSchema,
  CreateReviewSchema,
  CreateOfferSchema,
} from "@/shared/types";
import OpenAI from "openai";

const ADMIN_EMAIL = "ddensingh19@gmail.com";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// Auth endpoints
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });
  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();
  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60,
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user");
  return c.json({
    ...user,
    isAdmin: user?.email === ADMIN_EMAIL,
  });
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Helper to check admin
function isAdmin(user: MochaUser | undefined): boolean {
  return user?.email === ADMIN_EMAIL;
}

// Product endpoints
app.get("/api/products", async (c) => {
  const category = c.req.query("category");
  const search = c.req.query("search");
  const featured = c.req.query("featured");

  let query = "SELECT * FROM products WHERE 1=1";
  const params: any[] = [];

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  if (search) {
    query += " AND (name LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  if (featured === "true") {
    query += " AND is_featured = 1";
  }

  query += " ORDER BY created_at DESC";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

app.get("/api/products/:id", async (c) => {
  const id = c.req.param("id");
  const product = await c.env.DB.prepare(
    "SELECT * FROM products WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }

  return c.json(product);
});

app.post("/api/products", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!isAdmin(user)) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const body = await c.req.json();
  const validated = CreateProductSchema.parse(body);

  const discount =
    validated.sale_price && validated.price
      ? Math.round(
          ((validated.price - validated.sale_price) / validated.price) * 100
        )
      : null;

  const result = await c.env.DB.prepare(
    `INSERT INTO products (name, description, category, subcategory, price, sale_price, 
     discount_percentage, stock, image_url, is_featured, is_bestseller, is_organic)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      validated.name,
      validated.description || null,
      validated.category,
      validated.subcategory || null,
      validated.price,
      validated.sale_price || null,
      discount,
      validated.stock,
      validated.image_url || null,
      validated.is_featured ? 1 : 0,
      validated.is_bestseller ? 1 : 0,
      validated.is_organic ? 1 : 0
    )
    .run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

app.put("/api/products/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!isAdmin(user)) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const id = c.req.param("id");
  const body = await c.req.json();
  const validated = UpdateProductSchema.parse(body);

  const updates: string[] = [];
  const params: any[] = [];

  Object.entries(validated).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(
        typeof value === "boolean" ? (value ? 1 : 0) : value || null
      );
    }
  });

  if (updates.length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  await c.env.DB.prepare(
    `UPDATE products SET ${updates.join(", ")} WHERE id = ?`
  )
    .bind(...params)
    .run();

  return c.json({ success: true });
});

app.delete("/api/products/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!isAdmin(user)) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Cart endpoints
app.get("/api/cart", authMiddleware, async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, p.name, p.price, p.sale_price, p.image_url, p.stock
     FROM cart c
     JOIN products p ON c.product_id = p.id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`
  )
    .bind(user!.id)
    .all();

  return c.json(results);
});

app.post("/api/cart", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const validated = AddToCartSchema.parse(body);

  const existing = await c.env.DB.prepare(
    "SELECT * FROM cart WHERE user_id = ? AND product_id = ?"
  )
    .bind(user!.id, validated.product_id)
    .first();

  if (existing) {
    await c.env.DB.prepare(
      "UPDATE cart SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?"
    )
      .bind(validated.quantity, user!.id, validated.product_id)
      .run();
  } else {
    await c.env.DB.prepare(
      "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)"
    )
      .bind(user!.id, validated.product_id, validated.quantity)
      .run();
  }

  return c.json({ success: true });
});

app.put("/api/cart/:productId", authMiddleware, async (c) => {
  const user = c.get("user");
  const productId = c.req.param("productId");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?"
  )
    .bind(body.quantity, user!.id, productId)
    .run();

  return c.json({ success: true });
});

app.delete("/api/cart/:productId", authMiddleware, async (c) => {
  const user = c.get("user");
  const productId = c.req.param("productId");

  await c.env.DB.prepare(
    "DELETE FROM cart WHERE user_id = ? AND product_id = ?"
  )
    .bind(user!.id, productId)
    .run();

  return c.json({ success: true });
});

app.delete("/api/cart", authMiddleware, async (c) => {
  const user = c.get("user");
  await c.env.DB.prepare("DELETE FROM cart WHERE user_id = ?")
    .bind(user!.id)
    .run();
  return c.json({ success: true });
});

// Wishlist endpoints
app.get("/api/wishlist", authMiddleware, async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    `SELECT w.*, p.* FROM wishlist w
     JOIN products p ON w.product_id = p.id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC`
  )
    .bind(user!.id)
    .all();

  return c.json(results);
});

app.post("/api/wishlist", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const existing = await c.env.DB.prepare(
    "SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?"
  )
    .bind(user!.id, body.product_id)
    .first();

  if (existing) {
    return c.json({ success: true });
  }

  await c.env.DB.prepare(
    "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)"
  )
    .bind(user!.id, body.product_id)
    .run();

  return c.json({ success: true });
});

app.delete("/api/wishlist/:productId", authMiddleware, async (c) => {
  const user = c.get("user");
  const productId = c.req.param("productId");

  await c.env.DB.prepare(
    "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?"
  )
    .bind(user!.id, productId)
    .run();

  return c.json({ success: true });
});

// Order endpoints
app.get("/api/orders", authMiddleware, async (c) => {
  const user = c.get("user");
  const status = c.req.query("status");

  let query = "SELECT * FROM orders WHERE user_id = ?";
  const params: any[] = [user!.id];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  query += " ORDER BY created_at DESC";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

app.get("/api/orders/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const order = await c.env.DB.prepare(
    "SELECT * FROM orders WHERE id = ? AND user_id = ?"
  )
    .bind(id, user!.id)
    .first();

  if (!order) {
    return c.json({ error: "Order not found" }, 404);
  }

  const { results: items } = await c.env.DB.prepare(
    "SELECT * FROM order_items WHERE order_id = ?"
  )
    .bind(id)
    .all();

  return c.json({ ...order, items });
});

app.post("/api/orders", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const validated = CreateOrderSchema.parse(body);

  const { results: cartItems } = await c.env.DB.prepare(
    `SELECT c.*, p.name, p.price, p.sale_price, p.image_url
     FROM cart c
     JOIN products p ON c.product_id = p.id
     WHERE c.user_id = ?`
  )
    .bind(user!.id)
    .all();

  if (!cartItems || cartItems.length === 0) {
    return c.json({ error: "Cart is empty" }, 400);
  }

  const subtotal = cartItems.reduce((sum: number, item: any) => {
    const price = item.sale_price || item.price;
    return sum + price * item.quantity;
  }, 0);

  const deliveryFee = subtotal >= 50 ? 0 : 3.99;
  const tax = subtotal * 0.085;
  const discount = 0;
  const total = subtotal + deliveryFee + tax - discount;

  const orderNumber = `ORD${Date.now()}`;

  const orderResult = await c.env.DB.prepare(
    `INSERT INTO orders (order_number, user_id, user_email, user_name, status, 
     payment_status, subtotal, delivery_fee, discount, tax, total, delivery_address, 
     delivery_slot, coupon_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      orderNumber,
      user!.id,
      user!.email,
      user!.google_user_data.name || null,
      "confirmed",
      "paid",
      subtotal,
      deliveryFee,
      discount,
      tax,
      total,
      validated.delivery_address,
      validated.delivery_slot || null,
      validated.coupon_code || null
    )
    .run();

  const orderId = orderResult.meta.last_row_id;

  for (const item of cartItems as any[]) {
    await c.env.DB.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        orderId,
        item.product_id,
        item.name,
        item.image_url,
        item.quantity,
        item.sale_price || item.price
      )
      .run();
  }

  await c.env.DB.prepare("DELETE FROM cart WHERE user_id = ?")
    .bind(user!.id)
    .run();

  await c.env.DB.prepare(
    "INSERT INTO notifications (user_id, title, message, type, order_id) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(
      user!.id,
      "Order Confirmed",
      `Your order ${orderNumber} has been confirmed and is being prepared.`,
      "order",
      orderId
    )
    .run();

  return c.json({ orderId, orderNumber, success: true }, 201);
});

// Admin order management
app.get("/api/admin/orders", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!isAdmin(user)) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM orders ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

app.put("/api/admin/orders/:id/status", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!isAdmin(user)) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const id = c.req.param("id");
  const body = await c.req.json();

  const order = await c.env.DB.prepare("SELECT * FROM orders WHERE id = ?")
    .bind(id)
    .first<any>();

  if (!order) {
    return c.json({ error: "Order not found" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  )
    .bind(body.status, id)
    .run();

  const statusMessages: Record<string, string> = {
    confirmed: "Your order has been confirmed and is being prepared.",
    packed: "Your order has been packed and will be shipped soon.",
    shipped: "Your order has been shipped and is on its way!",
    delivered: "Your order has been delivered. Enjoy your groceries!",
  };

  const message = statusMessages[body.status] || `Order status updated to ${body.status}`;

  await c.env.DB.prepare(
    "INSERT INTO notifications (user_id, title, message, type, order_id) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(
      order.user_id,
      "Order Update",
      message,
      "order",
      id
    )
    .run();

  return c.json({ success: true });
});

// Reviews
app.get("/api/products/:id/reviews", async (c) => {
  const productId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC"
  )
    .bind(productId)
    .all();

  return c.json(results);
});

app.post("/api/reviews", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const validated = CreateReviewSchema.parse(body);

  await c.env.DB.prepare(
    "INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(
      validated.product_id,
      user!.id,
      user!.google_user_data.name || null,
      validated.rating,
      validated.comment || null
    )
    .run();

  const { avg_rating, count } = await c.env.DB.prepare(
    "SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = ?"
  )
    .bind(validated.product_id)
    .first<any>();

  await c.env.DB.prepare(
    "UPDATE products SET rating = ?, review_count = ? WHERE id = ?"
  )
    .bind(avg_rating, count, validated.product_id)
    .run();

  return c.json({ success: true }, 201);
});

// Offers
app.get("/api/offers", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM offers WHERE is_active = 1 ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

app.post("/api/offers", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!isAdmin(user)) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const body = await c.req.json();
  const validated = CreateOfferSchema.parse(body);

  const result = await c.env.DB.prepare(
    `INSERT INTO offers (title, description, discount_percentage, coupon_code, valid_from, valid_until)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      validated.title,
      validated.description || null,
      validated.discount_percentage || null,
      validated.coupon_code || null,
      validated.valid_from || null,
      validated.valid_until || null
    )
    .run();

  const { results: users } = await c.env.DB.prepare(
    "SELECT DISTINCT user_id FROM cart"
  ).all();

  for (const userRow of users as any[]) {
    await c.env.DB.prepare(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)"
    )
      .bind(
        userRow.user_id,
        "New Offer!",
        validated.title,
        "offer"
      )
      .run();
  }

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// Notifications
app.get("/api/notifications", authMiddleware, async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
  )
    .bind(user!.id)
    .all();

  return c.json(results);
});

app.put("/api/notifications/:id/read", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  await c.env.DB.prepare(
    "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?"
  )
    .bind(id, user!.id)
    .run();

  return c.json({ success: true });
});

// AI product recommendations
app.get("/api/products/:id/recommendations", async (c) => {
  const productId = c.req.param("id");

  const product = await c.env.DB.prepare(
    "SELECT * FROM products WHERE id = ?"
  )
    .bind(productId)
    .first<any>();

  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM products 
     WHERE category = ? AND id != ? 
     ORDER BY rating DESC, review_count DESC 
     LIMIT 6`
  )
    .bind(product.category, productId)
    .all();

  return c.json(results);
});

// AI chat support
app.post("/api/chat", authMiddleware, async (c) => {
  const body = await c.req.json();

  try {
    const openai = new OpenAI({
      apiKey: c.env.OPENAI_API_KEY,
    });

    const { results: products } = await c.env.DB.prepare(
      "SELECT name, category, price FROM products LIMIT 20"
    ).all();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful customer support assistant for GroceryMart, an online grocery store. 
          Help customers with product queries, order tracking, and general questions. 
          Be friendly, concise, and helpful. Available products include: ${JSON.stringify(products)}`,
        },
        {
          role: "user",
          content: body.message,
        },
      ],
      max_tokens: 300,
    });

    return c.json({
      message: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return c.json(
      {
        message:
          "I'm here to help! You can ask me about products, orders, or any questions about shopping at GroceryMart.",
      },
      200
    );
  }
});

export default app;
