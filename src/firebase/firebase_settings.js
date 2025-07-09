
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyB4VFBnRtP7CqXoQu6AiWr5-guy9_X9MVM",
  authDomain: "tesis-1ff1a.firebaseapp.com",
  projectId: "tesis-1ff1a",
  storageBucket: "tesis-1ff1a.firebasestorage.app",
  messagingSenderId: "651791046212",
  appId: "1:651791046212:web:b8c678643145d181fe0e11",
  measurementId: "G-XP39CWPMN0"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);


export { db,storage };
