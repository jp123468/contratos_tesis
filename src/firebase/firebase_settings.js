
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyBULY3yX2ikUDkhbNSZRRUQ3Eq_8JFoWAQ",
  authDomain: "tesis-943bb.firebaseapp.com",
  projectId: "tesis-943bb",
  storageBucket: "tesis-943bb.firebasestorage.app",
  messagingSenderId: "856060883167",
  appId: "1:856060883167:web:4f4a05283ac11a42f0b96a",
  measurementId: "G-BPY956FMW0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { db,storage };
