"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { checkAdminStatus } from "../lib/auth";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // User is signed in, now check if they're an admin
          console.log("User authenticated:", user.email);

          const isAdmin = await checkAdminStatus(user.uid);

          if (isAdmin) {
            console.log("✅ User is an admin, redirecting to dashboard");
            router.push("/dashboard");
          } else {
            console.log("❌ User is not an admin, redirecting to login");
            await auth.signOut();
            router.push("/auth/login");
          }
        } else {
          // No user is signed in
          console.log("No user authenticated, redirecting to login");
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        router.push("/auth/login");
      } finally {
        setChecking(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      <div className="text-center">
        <div className="animate-spin text-6xl mb-4">🔄</div>
        <p className="text-xl font-semibold text-gray-700">
          {checking ? "Checking authentication..." : "Redirecting..."}
        </p>
        <p className="text-sm text-gray-500 mt-2">Please wait...</p>
      </div>
    </div>
  );
}
