import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDarHU2Jl5pWgzNT-m3qUQK14m0uFJIiFs";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // There isn't a direct listModels method on the client SDK easily accessible without using the model manager or REST.
        // However, we can try to hit the API directly or just try a simple generation to see if it works.
        // Actually, let's try to use the model and catch the error, but we already know it fails.

        // Let's try to use the REST API to list models.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        console.log("Available models:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
