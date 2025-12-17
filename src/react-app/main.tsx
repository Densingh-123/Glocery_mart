import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/react-app/index.css";
import App from "@/react-app/App.tsx";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster position="bottom-right" toastOptions={{
      style: {
        background: '#333',
        color: '#fff',
      },
      success: {
        duration: 3000,
        iconTheme: {
          primary: '#22c55e',
          secondary: '#fff',
        },
      },
    }} />
    <App />
  </StrictMode>
);
