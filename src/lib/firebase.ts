// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBm88UC7aIft3bxbBA4gJQw1NkcWgwdhCE",
  authDomain: "achat-achat-app.firebaseapp.com",
  projectId: "achat-achat-app",
  storageBucket: "achat-achat-app.appspot.com",
  messagingSenderId: "658075773220",
  appId: "1:658075773220:web:3946c5cbc8db1b1439ebb1",
  measurementId: "G-XLE0G7EQPQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
