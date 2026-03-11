// lib/firebase.ts
// ═══════════════════════════════════════════════════════════
// 🔥 FIREBASE CONFIG - SINGLE PROJECT (locly-92848)
// Used for: Everything (Admin auth + Seller data)
// Using environment variables for security
// ═══════════════════════════════════════════════════════════
import { initializeApp, FirebaseApp } from "firebase/app";
import { Auth, getAuth, onAuthStateChanged, User } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { Functions, getFunctions } from "firebase/functions";

// Firebase Project Config (loaded from environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Firebase configuration:", {
    apiKey: firebaseConfig.apiKey ? "✅ Set" : "❌ Missing",
    authDomain: firebaseConfig.authDomain ? "✅ Set" : "❌ Missing",
    projectId: firebaseConfig.projectId ? "✅ Set" : "❌ Missing",
    storageBucket: firebaseConfig.storageBucket ? "✅ Set" : "❌ Missing",
    messagingSenderId: firebaseConfig.messagingSenderId
      ? "✅ Set"
      : "❌ Missing",
    appId: firebaseConfig.appId ? "✅ Set" : "❌ Missing",
  });

  throw new Error(
    "❌ Firebase configuration is missing!\n\n" +
      "Please ensure your .env.local file exists in the project root with:\n" +
      "- NEXT_PUBLIC_FIREBASE_API_KEY\n" +
      "- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n" +
      "- NEXT_PUBLIC_FIREBASE_PROJECT_ID\n" +
      "- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET\n" +
      "- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID\n" +
      "- NEXT_PUBLIC_FIREBASE_APP_ID\n\n" +
      "Then restart your development server: npm run dev"
  );
}

console.log("✅ Firebase initialized with project:", firebaseConfig.projectId);

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app);

// Set Firestore emulator if in development
if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_EMULATOR === "true"
) {
  console.log("Using Firebase Emulator");
}

export { app, auth, db, functions };

// Helper function to get current user
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, resolve, reject);
    return () => unsubscribe();
  });
};

export default app;
