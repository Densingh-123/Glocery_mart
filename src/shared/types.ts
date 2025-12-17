import z from "zod";

// Product schemas
export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  subcategory: z.string().nullable(),
  price: z.number(),
  sale_price: z.number().nullable(),
  discount_percentage: z.number().nullable(),
  stock: z.number(),
  image_url: z.string().nullable(),
  is_featured: z.number(),
  is_bestseller: z.number(),
  is_organic: z.number(),
  rating: z.number(),
  review_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  price: z.number().positive(),
  sale_price: z.number().positive().optional(),
  stock: z.number().int().min(0),
  image_url: z.string().url().optional(),
  is_featured: z.boolean().optional(),
  is_bestseller: z.boolean().optional(),
  is_organic: z.boolean().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// Order schemas
export const OrderSchema = z.object({
  id: z.number(),
  order_number: z.string(),
  user_id: z.string(),
  user_email: z.string(),
  user_name: z.string().nullable(),
  status: z.string(),
  payment_status: z.string(),
  subtotal: z.number(),
  delivery_fee: z.number(),
  discount: z.number(),
  tax: z.number(),
  total: z.number(),
  delivery_address: z.string(),
  delivery_slot: z.string().nullable(),
  coupon_code: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  delivered_at: z.string().nullable(),
});

export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderSchema = z.object({
  delivery_address: z.string().min(1),
  delivery_slot: z.string().optional(),
  coupon_code: z.string().optional(),
  payment_method: z.string().min(1),
});

// Cart schemas
export const CartItemSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

export const AddToCartSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

// Review schemas
export const ReviewSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  user_id: z.string(),
  user_name: z.string().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  is_verified: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const CreateReviewSchema = z.object({
  product_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// Notification schemas
export const NotificationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  is_read: z.boolean().or(z.number()), // Allow both for compatibility
  read: z.boolean().optional(), // Add read property
  order_id: z.string().optional().nullable(), // Order ID can be string in Firestore
  created_at: z.any(), // Firestore timestamp
});

export type Notification = z.infer<typeof NotificationSchema>;

// Offer schemas
export const OfferSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  discount_percentage: z.number().nullable(),
  coupon_code: z.string().nullable(),
  valid_from: z.string().nullable(),
  valid_until: z.string().nullable(),
  is_active: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Offer = z.infer<typeof OfferSchema>;

export const CreateOfferSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  discount_percentage: z.number().int().min(0).max(100).optional(),
  coupon_code: z.string().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
});
