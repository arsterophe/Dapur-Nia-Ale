import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC4HBFrrKsOQFuyMK32OySRhIE4OiRpzSM",
    authDomain: "dapur-nia-2fda6.firebaseapp.com",
    projectId: "dapur-nia-2fda6",
    storageBucket: "dapur-nia-2fda6.firebasestorage.app",
    messagingSenderId: "378878598945",
    appId: "1:378878598945:web:1c1e231b1e8bc1acc2a860"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);