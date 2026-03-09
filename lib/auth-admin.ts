// lib/auth-admin.ts
/**
 * Helper functions to create/manage admin users in Firebase Auth
 * IMPORTANT: This uses the REST API since we can't use Admin SDK on client
 */

import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  AuthError,
} from "firebase/auth";

/**
 * Create a new admin user in Firebase Authentication
 */
export const createAdminAuthUser = async (
  email: string,
  tempPassword: string
): Promise<{ uid: string; email: string } | null> => {
  try {
    console.log("Creating Firebase Auth user:", email);

    // CREATE USER IN FIREBASE AUTH
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      tempPassword
    );

    const user = userCredential.user;

    console.log("Firebase Auth user created:", user.uid);
    console.log("Email:", user.email);

    // SEND PASSWORD RESET EMAIL SO THEY CAN SET THEIR OWN PASSWORD
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent to:", email);
    } catch (emailError) {
      console.warn("Could not send password reset email:", emailError);
      // Continue anyway - user can reset password later
    }

    return {
      uid: user.uid,
      email: user.email || email,
    };
  } catch (error: unknown) {
    console.error("Error creating Firebase Auth user:", error);

    // HANDLE SPECIFIC ERRORS
    if (error && typeof error === "object" && "code" in error) {
      const authError = error as AuthError;

      if (authError.code === "auth/email-already-in-use") {
        console.warn("Email already in use - user might already exist");
        return null;
      } else if (authError.code === "auth/weak-password") {
        console.error("Password is too weak");
        return null;
      } else if (authError.code === "auth/invalid-email") {
        console.error("Invalid email format");
        return null;
      }
    }

    throw error;
  }
};

/**
 * Send password reset email to admin
 */
export const sendAdminPasswordReset = async (email: string): Promise<void> => {
  try {
    console.log("Sending password reset email to:", email);

    await sendPasswordResetEmail(auth, email);

    console.log("Password reset email sent successfully");
  } catch (error: unknown) {
    console.error("Error sending password reset email:", error);

    if (error && typeof error === "object" && "code" in error) {
      const authError = error as AuthError;

      if (authError.code === "auth/user-not-found") {
        throw new Error("User not found. Make sure the email is correct.");
      }
    }

    throw error;
  }
};
