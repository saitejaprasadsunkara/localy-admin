// app/auth/logout/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOutAdmin } from "../../../lib/auth";
import toast from "react-hot-toast";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Sign out from Firebase
        await signOutAdmin();

        // Show success message
        toast.success("You have been logged out successfully");

        // Redirect to login page
        setTimeout(() => {
          router.push("/auth/login");
        }, 1000);
      } catch (error) {
        console.error("Logout error:", error);
        toast.error("Failed to logout");

        // Still redirect even if there's an error
        setTimeout(() => {
          router.push("/auth/login");
        }, 1000);
      }
    };

    handleLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Logging you out...
        </h1>
        <p className="text-gray-600">
          Please wait while we sign you out securely.
        </p>
      </div>
    </div>
  );
}
