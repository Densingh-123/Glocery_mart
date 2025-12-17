import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDGKVhXtRCSWaFKy_81SE32JOh9Ek8edts",
    authDomain: "online-shopping-763ec.firebaseapp.com",
    projectId: "online-shopping-763ec",
    storageBucket: "online-shopping-763ec.firebasestorage.app",
    messagingSenderId: "263749639067",
    appId: "1:263749639067:web:fc3a40d2bc912c2fd85f3e",
    measurementId: "G-XZVBQY6JJ2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
