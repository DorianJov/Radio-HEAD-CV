// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCeG1vHA0v71lZ2Hpr-kyKHZD0-iQOSWOo",
    authDomain: "publicradiochat.firebaseapp.com",
    projectId: "publicradiochat",
    storageBucket: "publicradiochat.firebasestorage.app",
    messagingSenderId: "713588564332",
    appId: "1:713588564332:web:467a20e12f1b4f3d361349",
    measurementId: "G-RXRG1N795D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Realtime Database with the correct regional URL
const database = getDatabase(app, "https://publicradiochat-default-rtdb.europe-west1.firebasedatabase.app");

console.log("Firebase initialized successfully!");

// Export Firebase app and database if needed elsewhere
export { app, database };
