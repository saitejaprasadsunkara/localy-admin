import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const MOBILE_APP_CONFIG = {
  // ⚠️ REPLACE THESE WITH YOUR ACTUAL VALUES FROM FIREBASE
  apiKey: "AIzaSyCLlRpn808dzuyJbZst4uh6zT7A6tYk4Cg",
  authDomain: "locly-92848.firebaseapp.com",
  projectId: "locly-92848",
  storageBucket: "locly-92848.firebasestorage.app",
  messagingSenderId: "194126335209",
  appId: "1:194126335209:web:14e46933b34cc23efcf478",
  measurementId: "G-B2SGYQZSL7", // Optional
};

// ═══════════════════════════════════════════════════════════
// 🔥 INITIALIZE MOBILE APP FIREBASE
// ═══════════════════════════════════════════════════════════

let mobileApp: FirebaseApp | null = null;
let mobileDb: Firestore | null = null;
let mobileStorage: FirebaseStorage | null = null;

/**
 * Initialize and return Mobile App Firestore instance
 * Used by Admin Portal to read/write verification data
 */
export function getMobileAppFirestore(): Firestore {
  if (!mobileDb) {
    // Check if all required config values are set
    if (
      MOBILE_APP_CONFIG.apiKey === "AIzaSyCLlRpn808dzuyJbZst4uh6zT7A6tYk4Cg" ||
      MOBILE_APP_CONFIG.messagingSenderId === "194126335209"
    ) {
      throw new Error(
        "❌ MOBILE APP FIREBASE CONFIG NOT SET!\n\n" +
          "Please update firebaseMultiProject.ts with your actual Firebase config:\n\n" +
          "1. Go to Firebase Console\n" +
          "2. Select project: locly-92848\n" +
          "3. Settings (⚙️) → Project Settings\n" +
          "4. Copy config values\n" +
          "5. Paste into firebaseMultiProject.ts\n\n" +
          "Current config: " +
          JSON.stringify(MOBILE_APP_CONFIG, null, 2)
      );
    }

    try {
      // Initialize mobile app with unique name
      mobileApp = initializeApp(MOBILE_APP_CONFIG, "mobile-app");

      // Get Firestore instance pointing to mobile app project
      mobileDb = getFirestore(mobileApp);

      // Get Storage instance pointing to mobile app project
      mobileStorage = getStorage(mobileApp);

      console.log("✅ Mobile App Firestore connected:", {
        projectId: MOBILE_APP_CONFIG.projectId,
        location: "us-central1",
      });
    } catch (error) {
      console.error("❌ Error initializing Mobile App Firebase:", error);
      throw error;
    }
  }

  return mobileDb;
}

/**
 * Get Mobile App Storage instance
 */
export function getMobileAppStorage(): FirebaseStorage {
  if (!mobileStorage) {
    getMobileAppFirestore(); // Initialize if not already done
  }

  if (!mobileStorage) {
    throw new Error("Failed to initialize Mobile App Storage");
  }

  return mobileStorage;
}

/**
 * Initialize Firebase Admin (returns the app instance)
 */
export function initializeFirebaseAdmin() {
  if (!mobileApp) {
    getMobileAppFirestore(); // Initialize if not already done
  }
  return mobileApp;
}

// ═══════════════════════════════════════════════════════════
// 🔥 TEST CONNECTION
// ═══════════════════════════════════════════════════════════

/**
 * Test if connection to mobile app Firestore works
 */
export async function testMobileAppConnection(): Promise<boolean> {
  try {
    getMobileAppFirestore();
    console.log("✅ Mobile App Firestore is accessible");
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to Mobile App Firestore:", error);
    return false;
  }
}
