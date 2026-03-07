// lib/auth.ts
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export interface AdminUser extends User {
  role?: "super_admin" | "admin" | "moderator";
  permissions?: Record<string, boolean>;
}

// Extended Firebase User type with custom claims
interface FirebaseUserWithClaims extends User {
  customClaims?: {
    role?: string;
    permissions?: Record<string, boolean>;
  };
}

// Firebase Auth Error interface
interface FirebaseAuthError {
  code?: string;
  message?: string;
}

/**
 * Sign in admin with email and password
 */
export const signInAdmin = async (
  email: string,
  password: string
): Promise<{ user: AdminUser | null; error: string | null }> => {
  try {
    // Set persistence
    await setPersistence(auth, browserLocalPersistence);

    // Sign in
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Get admin data from Firestore
    const adminRef = doc(db, "admins", user.uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      await firebaseSignOut(auth);
      return {
        user: null,
        error: "Admin account not found. Contact super admin.",
      };
    }

    const adminData = adminSnap.data();

    // Check if admin is active
    if (adminData.status !== "active") {
      await firebaseSignOut(auth);
      return {
        user: null,
        error: "Admin account is inactive. Contact super admin.",
      };
    }

    // Create admin user object with role and permissions
    const adminUser: AdminUser = {
      ...user,
      role: adminData.role,
      permissions: adminData.permissions,
    };

    // Update last login
    const userRef = doc(db, "users", user.uid);
    await getDoc(userRef); // Just to verify user exists

    return {
      user: adminUser,
      error: null,
    };
  } catch (error) {
    let errorMessage = "Login failed";
    const authError = error as FirebaseAuthError;

    if (authError.code === "auth/user-not-found") {
      errorMessage = "Admin account not found";
    } else if (authError.code === "auth/wrong-password") {
      errorMessage = "Invalid password";
    } else if (authError.code === "auth/invalid-email") {
      errorMessage = "Invalid email format";
    } else if (authError.code === "auth/too-many-requests") {
      errorMessage = "Too many login attempts. Try again later.";
    } else if (authError.code === "auth/user-disabled") {
      errorMessage = "This account has been disabled";
    }

    return {
      user: null,
      error: errorMessage,
    };
  }
};

/**
 * Sign out admin
 */
export const signOutAdmin = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Check if user has permission
 */
export const hasPermission = (permission: string): boolean => {
  const user = auth.currentUser as FirebaseUserWithClaims | null;
  if (!user) return false;

  const customClaims = user.customClaims || {};
  const permissions = customClaims.permissions || {};

  return permissions[permission] === true;
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (): boolean => {
  const user = auth.currentUser as FirebaseUserWithClaims | null;
  if (!user) return false;

  const customClaims = user.customClaims || {};
  return customClaims.role === "super_admin";
};

/**
 * Check if user is admin
 */
export const isAdmin = (): boolean => {
  const user = auth.currentUser as FirebaseUserWithClaims | null;
  if (!user) return false;

  const customClaims = user.customClaims || {};
  const role = customClaims.role;

  return role === "admin" || role === "super_admin";
};

/**
 * Get user role
 */
export const getUserRole = (): string | null => {
  const user = auth.currentUser as FirebaseUserWithClaims | null;
  if (!user) return null;

  const customClaims = user.customClaims || {};
  return customClaims.role || null;
};
