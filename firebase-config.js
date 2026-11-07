// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBW--aEDkVEu2tNSCm-WDCUmdxdOi-zL7w",
  authDomain: "attendance-system-580e6.firebaseapp.com",
  projectId: "attendance-system-580e6",
  storageBucket: "attendance-system-580e6.firebasestorage.app",
  messagingSenderId: "887294839449",
  appId: "1:887294839449:web:03164a056992b52e6a8608"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
