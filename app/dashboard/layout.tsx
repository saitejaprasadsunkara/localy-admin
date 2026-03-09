// app/dashboard/layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import { signOutAdmin, getCurrentUser } from "../../lib/auth";

import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<string>("Loading...");
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);

  // CHECK USER ROLE FROM FIRESTORE
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        // GET USER DATA FROM FIRESTORE /users/{uid}
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const role = userData?.role || "admin";

          // SET ROLE
          if (role === "super_admin") {
            setUserRole("Super Admin");
            setIsSuperAdminUser(true);
          } else {
            setUserRole("Admin");
            setIsSuperAdminUser(false);
          }
        } else {
          // DEFAULT TO ADMIN IF NO DOCUMENT
          setUserRole("Admin");
          setIsSuperAdminUser(false);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        setUserRole("Admin");
        setIsSuperAdminUser(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [router]);

  // NAVIGATION ITEMS
  const navigationItems = [
    {
      href: "/dashboard",
      label: "Dashboards",
      icon: "📊",
      visible: true,
    },
    {
      href: "/dashboard/sellers",
      label: "Sellers",
      icon: "🏪",
      visible: true,
    },
    {
      href: "/dashboard/drivers",
      label: "Drivers",
      icon: "🚗",
      visible: true,
    },
    {
      href: "/dashboard/delivery-agents",
      label: "Delivery Agents",
      icon: "🚴",
      visible: true,
    },
    {
      href: "/dashboard/admin-management",
      label: "Admin Management",
      icon: "👨‍💼",
      visible: isSuperAdminUser, // ← ONLY SHOW FOR SUPER ADMIN
      badge: "SUPER", // ← SHOW BADGE
    },
    {
      href: "/dashboard/analytics",
      label: "Analytics",
      icon: "📈",
      visible: true,
    },
    {
      href: "/dashboard/audit-logs",
      label: "Audit Logs",
      icon: "📋",
      visible: true,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: "⚙️",
      visible: true,
    },
  ];

  const handleLogout = async () => {
    try {
      await signOutAdmin();
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") return true;
    if (href !== "/dashboard" && pathname.startsWith(href)) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-orange-500">L</span>
              <span className="font-semibold text-gray-900">Locly</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? "←" : "→"}
          </button>
        </div>

        {/* Role Badge - ONLY SHOW FOR SUPER ADMIN */}
        {sidebarOpen && isSuperAdminUser && (
          <div className="px-6 py-3 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <div className="px-3 py-2 bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg border border-orange-300">
              <p className="text-xs text-orange-700 font-bold flex items-center gap-1">
                👑 SUPER ADMIN
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Full system control
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems
            .filter((item) => item.visible)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-orange-100 text-orange-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                title={item.label}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    {item.badge && sidebarOpen && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
        </nav>

        {/* Super Admin Info Box */}
        {isSuperAdminUser && sidebarOpen && (
          <div className="px-4 py-4 border-t border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <p className="text-xs text-orange-900 font-bold mb-2">
              👑 Super Admin:
            </p>
            <ul className="text-xs text-orange-700 space-y-1">
              <li>✅ Manage all admins</li>
              <li>✅ Set permissions</li>
              <li>✅ Suspend accounts</li>
              <li>✅ Full audit access</li>
            </ul>
          </div>
        )}

        {/* Logout Button */}
        <div className="px-4 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && (
              <span className="text-sm font-semibold">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {pathname === "/dashboard" && "Dashboard"}
              {pathname.includes("sellers") && "Sellers Verification"}
              {pathname.includes("drivers") && "Drivers Verification"}
              {pathname.includes("delivery") && "Delivery Agents Verification"}
              {pathname.includes("admin-management") && "👑 Admin Management"}
              {pathname.includes("analytics") && "Analytics"}
              {pathname.includes("audit") && "Audit Logs"}
              {pathname.includes("settings") && "Settings"}
            </h1>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              Role: {userRole}
              {isSuperAdminUser && (
                <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded font-bold">
                  👑 SUPER ADMIN
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {isSuperAdminUser ? "👑 Super Admin" : "🔑 Admin"}
                </p>
                <p className="text-xs text-green-600">🟢 Online</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
