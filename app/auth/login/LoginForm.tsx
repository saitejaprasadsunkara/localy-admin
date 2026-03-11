// app/auth/login/LoginForm.tsx
/**
 * Admin Login Form
 * Logs in admin and verifies they exist in /admins collection
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { auth } from "../../../lib/firebase";
// import { isAdminUser, getAdminStatus } from "@/lib/auth";
import { isAdminUser, getAdminStatus } from "../../../lib/auth";
import toast from "react-hot-toast";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting login with email:", email);

      // 1. SIGN IN WITH EMAIL & PASSWORD
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      console.log("✅ Firebase Auth login successful:", user.uid);

      // 2. VERIFY USER EXISTS IN /admins COLLECTION
      const isAdmin = await isAdminUser(user.uid);

      if (!isAdmin) {
        console.error("❌ User is not an admin");
        setError("Access denied. This account does not have admin privileges.");

        // Sign out the user since they're not an admin
        await auth.signOut();
        setLoading(false);
        return;
      }

      // 3. CHECK ADMIN STATUS (ACTIVE/INACTIVE)
      const status = await getAdminStatus(user.uid);

      if (status !== "active") {
        console.error("❌ Admin account is not active");
        setError(
          `Access denied. Admin account status: ${status}. Please contact your super admin.`
        );

        await auth.signOut();
        setLoading(false);
        return;
      }

      console.log("✅ Admin verification passed");
      toast.success(`Welcome back, ${email}!`);

      // 4. REDIRECT TO DASHBOARD
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Login error:", err);

      if (err && typeof err === "object" && "code" in err) {
        const authError = err as AuthError;

        switch (authError.code) {
          case "auth/user-not-found":
            setError("User not found. Please check your email.");
            break;
          case "auth/wrong-password":
            setError("Incorrect password. Please try again.");
            break;
          case "auth/invalid-email":
            setError("Invalid email format.");
            break;
          case "auth/user-disabled":
            setError("This account has been disabled.");
            break;
          case "auth/too-many-requests":
            setError("Too many login attempts. Please try again later.");
            break;
          default:
            setError(authError.message || "Login failed. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }

      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-green-500 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">L</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Localy Admin</h1>
          <p className="text-gray-600 mt-2">Sign in to your admin account</p>
        </div>

        {/* LOGIN FORM */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* EMAIL INPUT */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@localy.me"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* PASSWORD INPUT */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">❌ {error}</p>
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* FOOTER INFO */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              💡 <strong>New admin?</strong> Ask your super admin for your login
              credentials. Youll receive a password reset email.
            </p>
          </div>
        </div>

        {/* SECURITY NOTE */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 This admin portal is protected. Only authorized administrators
            can access.
          </p>
        </div>
      </div>
    </div>
  );
}

// // app/auth/login/LoginForm.tsx
// "use client";

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import { signInAdmin } from "../../../lib/auth";
// import toast from "react-hot-toast";

// export default function LoginForm() {
//   const router = useRouter();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       // Validate inputs
//       if (!email.trim() || !password.trim()) {
//         setError("Please enter email and password");
//         return;
//       }

//       if (!email.includes("@")) {
//         setError("Please enter a valid email");
//         return;
//       }

//       // Sign in
//       const { user, error: signInError } = await signInAdmin(email, password);

//       if (signInError) {
//         setError(signInError);
//         toast.error(signInError);
//         return;
//       }

//       if (!user) {
//         setError("Login failed. Please try again.");
//         return;
//       }

//       // Success
//       toast.success("Login successful! 🎉");

//       // Redirect based on role
//       if (user.role === "super_admin") {
//         router.push("/dashboard");
//       } else {
//         router.push("/dashboard");
//       }
//     } catch (err) {
//       console.error("Login error:", err);
//       const errorMsg = err instanceof Error ? err.message : "An error occurred";
//       setError(errorMsg);
//       toast.error(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="w-full max-w-md">
//       {/* Header */}
//       <div className="text-center mb-8">
//         <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
//           <span className="text-3xl">🔐</span>
//         </div>
//         <h1 className="text-3xl font-bold text-gray-900 mb-2">Locly Admin</h1>
//         <p className="text-gray-600">Verification & Management Portal</p>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
//           <p className="text-red-700 text-sm font-medium">❌ {error}</p>
//         </div>
//       )}

//       {/* Form */}
//       <form onSubmit={handleSubmit} className="space-y-4">
//         {/* Email Input */}
//         <div>
//           <label className="block text-sm font-semibold text-gray-700 mb-2">
//             Admin Email
//           </label>
//           <div className="relative">
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               placeholder="admin@localy.app"
//               disabled={loading}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
//             />
//             <div className="absolute right-3 top-3.5 text-orange-500">📧</div>
//           </div>
//         </div>

//         {/* Password Input */}
//         <div>
//           <label className="block text-sm font-semibold text-gray-700 mb-2">
//             Password
//           </label>
//           <div className="relative">
//             <input
//               type={showPassword ? "text" : "password"}
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="••••••••"
//               disabled={loading}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               disabled={loading}
//               className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
//             >
//               {showPassword ? "👁️" : "🙈"}
//             </button>
//           </div>
//         </div>

//         {/* Remember Me */}
//         <div className="flex items-center">
//           <input
//             type="checkbox"
//             id="remember"
//             className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
//           />
//           <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
//             Remember me on this device
//           </label>
//         </div>

//         {/* Submit Button */}
//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//         >
//           {loading ? (
//             <>
//               <span className="inline-block animate-spin">⏳</span>
//               Signing in...
//             </>
//           ) : (
//             <>
//               Sign In
//               <span>→</span>
//             </>
//           )}
//         </button>

//         {/* Forgot Password */}
//         <div className="text-center pt-4 border-t border-gray-200">
//           <button
//             type="button"
//             onClick={() => alert("Contact super admin to reset password")}
//             className="text-orange-500 hover:text-orange-600 text-sm font-semibold"
//           >
//             Forgot password?
//           </button>
//         </div>
//       </form>

//       {/* Footer */}
//       <div className="mt-8 text-center text-xs text-gray-500">
//         <p>© 2024 Locly. All rights reserved.</p>
//         <p className="mt-1">Admin Portal v1.0</p>
//       </div>

//       {/* Demo Credentials (DEV ONLY - REMOVE IN PRODUCTION) */}
//       {process.env.NODE_ENV === "development" && (
//         <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
//           <p className="text-xs text-blue-700 font-semibold mb-2">
//             🔬 Development Demo Credentials:
//           </p>
//           <code className="text-xs text-blue-600 block">
//             Email: admin@locly.app
//             <br />
//             Password: (ask super admin)
//           </code>
//         </div>
//       )}
//     </div>
//   );
// }
