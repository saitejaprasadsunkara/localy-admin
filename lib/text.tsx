// // lib/auth.ts
// import {
//   signInWithEmailAndPassword,
//   signOut as firebaseSignOut,
//   User,
//   setPersistence,
//   browserLocalPersistence,
// } from "firebase/auth";
// import { auth, db } from "./firebase";
// import {
//   collection,
//   doc,
//   getDoc,
//   query,
//   where,
//   getDocs,
// } from "firebase/firestore";

// export interface AdminUser extends User {
//   role?: "super_admin" | "admin";
//   permissions?: Record<string, boolean>;
// }

// interface UserWithClaims extends User {
//   customClaims?: {
//     role?: string;
//     permissions?: Record<string, boolean>;
//   };
// }

// /**
//  * Check if user is admin by checking /admins collection
//  */
// export async function checkAdminStatus(uid: string): Promise<boolean> {
//   try {
//     const adminDoc = await getDoc(doc(db, "admins", auth.currentUser.uid));
//     const role = adminDoc.data()?.role;
//     return ["admin", "super_admin"].includes(adminDoc.data()?.role);
//   } catch (error) {
//     console.error("Error checking admin status:", error);
//     return false;
//   }
// }

// /**
//  * Sign in admin with email and password
//  */
// export const signInAdmin = async (
//   email: string,
//   password: string
// ): Promise<{ user: AdminUser | null; error: string | null }> => {
//   try {
//     // Set persistence
//     await setPersistence(auth, browserLocalPersistence);

//     // Sign in
//     const result = await signInWithEmailAndPassword(auth, email, password);
//     const user = result.user;

//     // Get admin data from Firestore
//     //const adminRef = doc(db, "admins", user.uid);
//     //const adminSnap = await getDoc(adminRef);

//     const adminRef = collection(db, "admins");
//     const q = query(adminRef, where("email", "==", user.email));
//     const querySnapshot = await getDocs(q);

//     if (querySnapshot.empty) {
//       await firebaseSignOut(auth);
//       return {
//         user: null,
//         error: "Admin account not found. Contact super admin.",
//       };
//     }

//     const adminSnap = querySnapshot.docs[0];
//     const adminData = adminSnap.data();

//     // Check if admin is active
//     if (adminData.status !== "active") {
//       await firebaseSignOut(auth);
//       return {
//         user: null,
//         error: "Admin account is inactive. Contact super admin.",
//       };
//     }

//     // Verify role
//     if (!["admin", "super_admin"].includes(adminData.role)) {
//       await firebaseSignOut(auth);
//       return {
//         user: null,
//         error: "Invalid admin role. Contact super admin.",
//       };
//     }

//     // Create admin user object with role and permissions
//     const adminUser: AdminUser = {
//       ...user,
//       role: adminData.role,
//       permissions: adminData.permissions,
//     };

//     // Update last login
//     const adminDoc = await getDoc(doc(db, "admins", auth.currentUser.uid));
//     return ["admin", "super_admin"].includes(adminDoc.data()?.role); // Just to verify user exists

//     return {
//       user: adminUser,
//       error: null,
//     };
//   } catch (error: unknown) {
//     let errorMessage = "Login failed";

//     if (error && typeof error === "object" && "code" in error) {
//       const firebaseError = error as { code: string };

//       if (firebaseError.code === "auth/user-not-found") {
//         errorMessage = "Admin account not found";
//       } else if (firebaseError.code === "auth/wrong-password") {
//         errorMessage = "Invalid password";
//       } else if (firebaseError.code === "auth/invalid-email") {
//         errorMessage = "Invalid email format";
//       } else if (firebaseError.code === "auth/too-many-requests") {
//         errorMessage = "Too many login attempts. Try again later.";
//       } else if (firebaseError.code === "auth/user-disabled") {
//         errorMessage = "This account has been disabled";
//       }
//     }

//     return {
//       user: null,
//       error: errorMessage,
//     };
//   }
// };

// /**
//  * Sign out admin
//  */
// export const signOutAdmin = async (): Promise<void> => {
//   try {
//     await firebaseSignOut(auth);
//   } catch (error) {
//     console.error("Sign out error:", error);
//     throw error;
//   }
// };

// /**
//  * Check if user is authenticated
//  */
// export const isAuthenticated = (): boolean => {
//   return auth.currentUser !== null;
// };

// /**
//  * Get current user
//  */
// export const getCurrentUser = (): User | null => {
//   return auth.currentUser;
// };

// /**
//  * Check if user has permission
//  */
// export const hasPermission = (permission: string): boolean => {
//   const user = auth.currentUser as UserWithClaims | null;
//   if (!user) return false;

//   const customClaims = user.customClaims || {};
//   const permissions = customClaims.permissions || {};

//   return permissions[permission] === true;
// };

// /**
//  * Check if user is super admin
//  */
// export const isSuperAdmin = (): boolean => {
//   const user = auth.currentUser as UserWithClaims | null;
//   if (!user) return false;

//   const customClaims = user.customClaims || {};
//   return customClaims.role === "super_admin";
// };

// /**
//  * Check if user is admin
//  */
// export const isAdmin = (): boolean => {
//   const user = auth.currentUser as UserWithClaims | null;
//   if (!user) return false;

//   const customClaims = user.customClaims || {};
//   const role = customClaims.role;

//   return role === "admin" || role === "super_admin";
// };

// /**
//  * Get user role
//  */
// export const getUserRole = (): string | null => {
//   const user = auth.currentUser as UserWithClaims | null;
//   if (!user) return null;

//   const customClaims = user.customClaims || {};
//   return customClaims.role || null;
// };
