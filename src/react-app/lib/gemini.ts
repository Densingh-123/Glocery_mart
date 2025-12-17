import { GoogleGenerativeAI } from "@google/generative-ai";
import { getProducts } from "./firestore";

// Initialize Gemini API
// NOTE: In a production environment, this key should be proxied through a backend
// to avoid exposing it in the client-side code.
const API_KEY = "AIzaSyDarHU2Jl5pWgzNT-m3qUQK14m0uFJIiFs";
const genAI = new GoogleGenerativeAI(API_KEY);

const KNOWLEDGE_BASE = `
1. **App Name**: GroceryMart
2. **Mission**: To provide fresh, organic, and high-quality groceries delivered to your doorstep.
3. **Delivery Areas**: Currently serving all major metro cities in India.
4. **Delivery Time**: Next-day delivery with slots from 10:00 AM to 12:00 PM.
5. **Delivery Fee**: Free delivery for orders above ₹50. For orders below ₹50, a fee of ₹3.99 applies.
6. **Payment Methods**: Credit/Debit Cards, UPI (Google Pay, PhonePe, Paytm), and Cash on Delivery (COD).
7. **Return Policy**: Easy returns within 24 hours of delivery for perishable items and 7 days for non-perishable items.
8. **Customer Support**: Email us at support@grocerymart.com or call 1800-123-4567 (9 AM - 9 PM).
9. **Product Categories**: Vegetables, Fruits, Dairy, Bakery, Meat, Snacks, Beverages, Household, Personal Care, Electronics, Electrical, Home & Kitchen, Fashion, Organic.
10. **Organic Products**: We have a dedicated section for 100% certified organic products.
11. **Tracking**: You can track your order status in real-time from the "My Orders" section.
12. **Notifications**: Get notified via SMS and App notifications for order confirmation, shipping, and delivery.
13. **Wishlist**: Save your favorite items to the wishlist for easy access later.
14. **Cart**: You can review your items, update quantities, and see the total cost including taxes and delivery fees in the Cart.
15. **Discounts**: Check the "Offers" page for exclusive coupons and "Deal of the Day" discounts.
16. **Account**: You can manage your profile, addresses, and view order history in the "Profile" section.
17. **Login**: Secure login via Email/Password or Google Sign-In.
18. **Admin Panel**: Dedicated dashboard for admins to manage products, orders, and offers.
19. **Search**: Use the search bar to quickly find products by name or category.
20. **Filters**: Filter products by category, price, and organic status.
21. **Quality Check**: All products undergo a strict quality check before packaging.
22. **Packaging**: We use eco-friendly and sustainable packaging materials.
23. **Cancellation**: You can cancel your order before it is packed from the "My Orders" page.
24. **Refunds**: Refunds are processed within 3-5 business days to the original payment method.
25. **Privacy**: We value your privacy and do not share your data with third parties.
26. **Security**: All payments are processed through secure gateways.
27. **App Version**: 1.0.0
28. **Developer**: Developed by the GroceryMart Tech Team.
29. **Feedback**: We love hearing from you! Use the feedback form in the Profile section.
30. **Vegetables**: Fresh tomatoes, onions, potatoes, spinach, carrots, etc.
31. **Fruits**: Apples, bananas, mangoes, oranges, grapes, etc.
32. **Dairy**: Milk, curd, paneer, butter, cheese, etc.
33. **Bakery**: Bread, buns, cakes, cookies, etc.
34. **Meat**: Chicken, mutton, fish, eggs, etc.
35. **Snacks**: Chips, biscuits, namkeen, popcorn, etc.
36. **Beverages**: Tea, coffee, juices, soft drinks, water, etc.
37. **Household**: Detergents, cleaners, tissues, trash bags, etc.
38. **Personal Care**: Soaps, shampoos, toothpaste, creams, etc.
39. **Electronics**: Batteries, bulbs, extension cords, etc.
40. **Electrical**: Switches, wires, plugs, etc.
41. **Home & Kitchen**: Cookware, storage containers, bottles, etc.
42. **Fashion**: T-shirts, caps, bags, etc.
43. **Organic**: Organic pulses, rice, spices, honey, etc.
44. **Best Sellers**: Check the home page for our most popular products.
45. **New Arrivals**: We add new products every week.
46. **Bulk Orders**: Contact support for bulk order inquiries and special discounts.
47. **Corporate Gifts**: We offer customized gift hampers for corporate events.
48. **Referral Program**: Refer a friend and get ₹100 off on your next order (Coming Soon).
49. **Loyalty Program**: Earn points on every purchase and redeem them for discounts (Coming Soon).
50. **Recipes**: Ask the AI assistant for recipes using available ingredients!
51. **Dietary Info**: Product descriptions include nutritional info and allergens.
52. **Expiry Dates**: We ensure all delivered products have a long shelf life.
53. **Damaged Items**: Report damaged items immediately for a replacement or refund.
54. **Wrong Items**: If you receive a wrong item, we will replace it free of charge.
55. **Late Delivery**: We strive for punctuality, but if we are late, we will notify you.
56. **Change Address**: You can change your delivery address before the order is shipped.
57. **Change Phone**: Update your phone number in the Profile section.
58. **Forgot Password**: Use the "Forgot Password" link on the login page to reset it.
59. **Guest Checkout**: Currently, you need to create an account to place an order.
60. **Minimum Order**: There is no minimum order value.
61. **Maximum Order**: For very large orders, please contact support.
62. **Availability**: Product availability is updated in real-time.
63. **Out of Stock**: You can't add out-of-stock items to the cart, but you can wishlist them.
64. **Pre-order**: We currently do not accept pre-orders.
65. **Subscription**: Subscribe to daily essentials like milk and bread (Coming Soon).
66. **Gift Cards**: Buy gift cards for your friends and family (Coming Soon).
67. **Mobile App**: Download our mobile app from the Play Store or App Store (Coming Soon).
68. **Social Media**: Follow us on Instagram, Facebook, and Twitter for updates.
69. **Blog**: Read our blog for health tips, recipes, and news.
70. **Careers**: We are hiring! Check our website for job openings.
71. **Partners**: We partner with local farmers and top brands.
72. **Sustainability**: We are committed to reducing our carbon footprint.
73. **Community**: We support local charities and food banks.
74. **FAQ**: Check the FAQ section on the website for more answers.
75. **Terms of Service**: Read our terms and conditions in the footer.
76. **Privacy Policy**: Read our privacy policy in the footer.
77. **Cookie Policy**: We use cookies to enhance your experience.
78. **Sitemap**: Navigate the site easily using the sitemap.
79. **Accessibility**: We are committed to making our app accessible to everyone.
80. **Language**: The app is currently available in English.
81. **Currency**: All prices are in Indian Rupees (₹).
82. **Time Zone**: All times are in Indian Standard Time (IST).
83. **Tax**: Prices are inclusive of all applicable taxes.
84. **Tips**: You can add a tip for the delivery partner at checkout.
85. **Rating**: Rate your products and delivery experience after receiving the order.
86. **Reviews**: Read reviews from other customers before buying.
87. **Q&A**: Ask questions about specific products on the product page.
88. **Comparison**: Compare products to find the best one for you.
89. **History**: View your past orders and reorder easily.
90. **Invoices**: Download tax invoices for your orders.
91. **Notifications Settings**: Manage your notification preferences in Settings.
92. **Theme**: The app supports Light and Dark modes (System Default).
93. **Data Saver**: Enable data saver mode in Settings (Coming Soon).
94. **Offline Mode**: Browse previously viewed products offline (Coming Soon).
95. **Cache**: Clear app cache in Settings if you face issues.
96. **Update**: Keep your app updated for the latest features.
97. **Support Ticket**: Raise a ticket for complex issues.
98. **Live Chat**: Chat with our support agents (9 AM - 6 PM).
99. **AI Assistant**: I am here 24/7 to help you with your shopping!
100. **Feedback**: Your feedback helps us improve.
`;

export const getChatResponse = async (userMessage: string) => {
    try {
        // Fetch products to provide context
        const products = await getProducts();
        const productContext = products.map(p =>
            `- ${p.name} (${p.category}): ₹${p.sale_price || p.price} - ${p.description} ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}`
        ).join("\n");

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
      You are a helpful customer support assistant for GroceryMart, an online grocery store.
      
      Here is the KNOWLEDGE BASE about the application:
      ${KNOWLEDGE_BASE}

      Here is the list of available products in our store:
      ${productContext}

      User Query: ${userMessage}

      Instructions:
      1. Answer the user's query based on the KNOWLEDGE BASE and available products.
      2. If they ask for a product we don't have, politely suggest alternatives if available, or say we don't have it.
      3. Be friendly, concise, and professional.
      4. If the user asks about order status or account details, ask them to check the "My Orders" section or "Profile" as you don't have access to their personal data yet.
      5. Format your response nicely using Markdown.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating AI response:", error);
        return "I'm sorry, I'm having trouble connecting to the brain right now. Please try again later.";
    }
};
