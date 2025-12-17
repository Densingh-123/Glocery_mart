import { GoogleGenerativeAI } from "@google/generative-ai";
import { getProducts } from "./firestore";

// Initialize Gemini API
// NOTE: In a production environment, this key should be proxied through a backend
// to avoid exposing it in the client-side code.
const API_KEY = "AIzaSyDarHU2Jl5pWgzNT-m3qUQK14m0uFJIiFs";
const genAI = new GoogleGenerativeAI(API_KEY);

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
      
      Here is the list of available products in our store:
      ${productContext}

      User Query: ${userMessage}

      Instructions:
      1. Answer the user's query based ONLY on the available products.
      2. If they ask for a product we don't have, politely suggest alternatives if available, or say we don't have it.
      3. Be friendly and concise.
      4. If the user asks about order status or account details, ask them to check the "My Orders" section or "Profile" as you don't have access to their personal data yet.
      5. Format your response nicely.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating AI response:", error);
        return "I'm sorry, I'm having trouble connecting to the brain right now. Please try again later.";
    }
};
