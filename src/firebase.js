
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyD-T5OB_BW78KN-2YzQUAaqlYuIihhJMq0",
  authDomain: "pharmarx-b99ac.firebaseapp.com",
  projectId: "pharmarx-b99ac",
  storageBucket: "pharmarx-b99ac.firebasestorage.app",
  messagingSenderId: "576131556029",
  appId: "1:576131556029:web:e647b878373926609f8dd4",
  measurementId: "G-ERGV0MFD3T"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;