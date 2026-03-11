// lib/auth.ts
/**
 * Authentication helper functions for the admin portal
 * All functions check the /admins collection (not /users)
 */

import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { User, signOut } from "firebase/auth";

/**
 * Check if a user is an admin by checking /admins collection
 * @param uid - User UID from Firebase Auth
 * @returns true if user has admin or super_admin role in /admins collection
 */
export const isAdminUser = async (uid: string): Promise<boolean> => {
  try {
    const adminDoc = await getDoc(doc(db, "admins", uid));

    if (!adminDoc.exists()) {
      console.log("User is not an admin (no document in /admins)");
      return false;
    }

    const data = adminDoc.data();
    const isAdmin = ["admin", "super_admin"].includes(data?.role);

    console.log(`User ${uid} admin status:`, isAdmin, `(role: ${data?.role})`);

    return isAdmin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

/**
 * Check if a user is a super admin
 * @param uid - User UID from Firebase Auth
 * @returns true if user has super_admin role
 */
export const isSuperAdminUser = async (uid: string): Promise<boolean> => {
  try {
    const adminDoc = await getDoc(doc(db, "admins", uid));

    if (!adminDoc.exists()) {
      return false;
    }

    const isSuperAdmin = adminDoc.data()?.role === "super_admin";
    console.log(`User ${uid} super_admin status:`, isSuperAdmin);

    return isSuperAdmin;
  } catch (error) {
    console.error("Error checking super admin status:", error);
    return false;
  }
};

/**
 * Get admin data from /admins collection
 * @param uid - User UID
 * @returns Admin document data or null
 */
export const getAdminData = async (uid: string) => {
  try {
    const adminDoc = await getDoc(doc(db, "admins", uid));

    if (!adminDoc.exists()) {
      console.log("Admin document not found for UID:", uid);
      return null;
    }

    return adminDoc.data();
  } catch (error) {
    console.error("Error getting admin data:", error);
    return null;
  }
};

/**
 * Get current admin user's data
 * @returns Admin data or null if not logged in or not an admin
 */
export const getCurrentAdminUser = async () => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("No user currently logged in");
      return null;
    }

    const adminData = await getAdminData(currentUser.uid);

    if (!adminData) {
      console.log("Current user is not an admin");
      return null;
    }

    return {
      uid: currentUser.uid,
      email: currentUser.email,
      ...adminData,
    };
  } catch (error) {
    console.error("Error getting current admin user:", error);
    return null;
  }
};

/**
 * Check if admin has specific permission
 * @param uid - User UID
 * @param permission - Permission name (e.g., "canApproveVerifications")
 * @returns true if admin has the permission
 */
export const hasPermission = async (
  uid: string,
  permission: string
): Promise<boolean> => {
  try {
    const adminData = await getAdminData(uid);

    if (!adminData) {
      return false;
    }

    const permissions = adminData.permissions || {};
    return permissions[permission] === true;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
};

/**
 * Check admin status (active/inactive)
 * @param uid - User UID
 * @returns "active", "inactive", or null
 */
export const getAdminStatus = async (uid: string): Promise<string | null> => {
  try {
    const adminData = await getAdminData(uid);

    if (!adminData) {
      return null;
    }

    return adminData.status || "unknown";
  } catch (error) {
    console.error("Error getting admin status:", error);
    return null;
  }
};

/**
 * Verify user is an admin (for middleware/route protection)
 * @param user - Firebase User object
 * @returns true if user exists in /admins collection
 */
export const verifyAdminAccess = async (user: User): Promise<boolean> => {
  if (!user) {
    console.log("No user provided for admin verification");
    return false;
  }

  try {
    const isAdmin = await isAdminUser(user.uid);

    if (!isAdmin) {
      console.warn(`Access denied: User ${user.email} is not an admin`);
      return false;
    }

    const status = await getAdminStatus(user.uid);

    if (status !== "active") {
      console.warn(
        `Access denied: Admin account is not active (status: ${status})`
      );
      return false;
    }

    console.log(`✅ Admin access verified for: ${user.email}`);
    return true;
  } catch (error) {
    console.error("Error verifying admin access:", error);
    return false;
  }
};

/**
 * Check if user is admin by checking /admins collection
 * Alias for isAdminUser for compatibility
 */
export async function checkAdminStatus(uid: string): Promise<boolean> {
  return isAdminUser(uid);
}

/**
 * Sign out admin user
 */
export const signOutAdmin = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log("Admin signed out successfully");
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};
