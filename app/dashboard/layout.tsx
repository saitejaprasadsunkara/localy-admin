// app/dashboard/layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOutAdmin, isSuperAdmin, getCurrentUser } from "../../lib/auth";
import toast from "react-hot-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<string>("Admin");
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false);

  useEffect(() => {
    // Get user role
    const user = getCurrentUser();
    if (user) {
      const displayName = user.displayName || "Admin";
      setUserRole("Super Admin");
      setIsSuperAdminUser(isSuperAdmin());
    }
  }, []);

  const navigationItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
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
      href: "/dashboard/admin-management",
      label: "Admin Management",
      icon: "👨‍💼",
      visible: isSuperAdminUser,
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
          >
            {sidebarOpen ? "←" : "→"}
          </button>
        </div>

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
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            ))}
        </nav>

        {/* Logout Button */}
        <div className="px-4 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
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
              {pathname.includes("admin-management") && "Admin Management"}
              {pathname.includes("analytics") && "Analytics"}
              {pathname.includes("audit") && "Audit Logs"}
              {pathname.includes("settings") && "Settings"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">Role: {userRole}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                A
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Admin</p>
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

// // app/dashboard/layout.tsx
// "use client";

// import React, { useState } from "react";
// import Link from "next/link";
// import { useRouter, usePathname } from "next/navigation";
// import { signOutAdmin, getUserRole, isSuperAdmin } from "@/../lib/auth";
// import toast from "react-hot-toast";

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const userRole = getUserRole();
//   const isSuperAdminUser = isSuperAdmin();

//   const navigationItems = [
//     {
//       href: "/dashboard",
//       label: "Dashboard",
//       icon: "📊",
//       visible: true,
//     },
//     {
//       href: "/dashboard/sellers",
//       label: "Sellers",
//       icon: "🏪",
//       visible: true,
//     },
//     {
//       href: "/dashboard/drivers",
//       label: "Drivers",
//       icon: "🚗",
//       visible: true,
//     },
//     {
//       href: "/dashboard/delivery-agents",
//       label: "Delivery Agents",
//       icon: "🚴",
//       visible: true,
//     },
//     {
//       href: "/dashboard/analytics",
//       label: "Analytics",
//       icon: "📈",
//       visible: true,
//     },
//     {
//       href: "/dashboard/audit-logs",
//       label: "Audit Logs",
//       icon: "📋",
//       visible: true,
//     },
//     {
//       href: "/dashboard/admin-management",
//       label: "Admin Management",
//       icon: "👨‍💼",
//       visible: isSuperAdminUser,
//     },
//     {
//       href: "/dashboard/settings",
//       label: "Settings",
//       icon: "⚙️",
//       visible: true,
//     },
//   ];

//   const handleLogout = async () => {
//     try {
//       await signOutAdmin();
//       toast.success("Logged out successfully");
//       router.push("/auth/login");
//     } catch (error) {
//       console.error("Logout error:", error);
//       toast.error("Failed to logout");
//     }
//   };

//   const isActive = (href: string) => {
//     if (href === "/dashboard" && pathname === "/dashboard") return true;
//     if (href !== "/dashboard" && pathname.startsWith(href)) return true;
//     return false;
//   };

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Sidebar */}
//       <aside
//         className={`${
//           sidebarOpen ? "w-64" : "w-20"
//         } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
//       >
//         {/* Logo */}
//         <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
//           {sidebarOpen && (
//             <Link href="/dashboard" className="flex items-center gap-2">
//               <span className="text-2xl font-bold text-orange-500">L</span>
//               <span className="font-semibold text-gray-900">Locly</span>
//             </Link>
//           )}
//           <button
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             {sidebarOpen ? "←" : "→"}
//           </button>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
//           {navigationItems
//             .filter((item) => item.visible)
//             .map((item) => (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
//                   isActive(item.href)
//                     ? "bg-orange-100 text-orange-700 font-semibold"
//                     : "text-gray-700 hover:bg-gray-100"
//                 }`}
//               >
//                 <span className="text-lg">{item.icon}</span>
//                 {sidebarOpen && <span className="text-sm">{item.label}</span>}
//               </Link>
//             ))}
//         </nav>

//         {/* Logout Button */}
//         <div className="px-4 py-4 border-t border-gray-200">
//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
//           >
//             <span className="text-lg">🚪</span>
//             {sidebarOpen && (
//               <span className="text-sm font-semibold">Logout</span>
//             )}
//           </button>
//         </div>
//       </aside>

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col">
//         {/* Navbar */}
//         <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
//           <div>
//             <h1 className="text-xl font-bold text-gray-900">
//               {pathname === "/dashboard" && "Dashboard"}
//               {pathname.includes("sellers") && "Sellers Verification"}
//               {pathname.includes("drivers") && "Drivers Verification"}
//               {pathname.includes("delivery") && "Delivery Agents Verification"}
//               {pathname.includes("admin-management") && "Admin Management"}
//               {pathname.includes("analytics") && "Analytics"}
//               {pathname.includes("audit") && "Audit Logs"}
//               {pathname.includes("settings") && "Settings"}
//             </h1>
//             <p className="text-sm text-gray-600 mt-1">
//               Role: {userRole || "Loading..."}
//             </p>
//           </div>

//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2">
//               <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
//                 A
//               </div>
//               <div>
//                 <p className="text-sm font-semibold text-gray-900">Admin</p>
//                 <p className="text-xs text-gray-600">Online</p>
//               </div>
//             </div>
//           </div>
//         </header>

//         {/* Page Content */}
//         <main className="flex-1 overflow-auto p-8">{children}</main>
//       </div>
//     </div>
//   );
// }
