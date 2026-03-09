// app/dashboard/admin-management/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
//import { db } from "@/lib/firebase";
import { createAdminAuthUser } from "../../../lib/auth-admin";
import { db } from "../../../lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getCurrentUser } from "../../../lib/auth";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "moderator";
  status: "active" | "inactive" | "suspended";
  permissions: {
    canApproveSellers: boolean;
    canApproveDrivers: boolean;
    canApproveDeliveryAgents: boolean;
    canViewAnalytics: boolean;
    canViewAuditLogs: boolean;
  };
  createdAt: Date;
  createdBy: string;
  stats: {
    totalApprovalsThisMonth: number;
    totalRejectionsThisMonth: number;
    averageApprovalTime: number;
  };
}

export default function AdminManagementPage() {
  // STATE MANAGEMENT
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "admin" as "admin" | "moderator",
    permissions: {
      canApproveSellers: true,
      canApproveDrivers: true,
      canApproveDeliveryAgents: true,
      canViewAnalytics: true,
      canViewAuditLogs: true,
    },
  });

  // LOAD ADMINS FROM FIRESTORE
  useEffect(() => {
    loadAdminsFromFirestore();
  }, []);

  const loadAdminsFromFirestore = async () => {
    try {
      setLoading(true);
      console.log("Loading admins from Firestore...");

      // FETCH FROM /admins COLLECTION
      const adminsRef = collection(db, "admins");
      const querySnapshot = await getDocs(adminsRef);

      const adminsData: AdminUser[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Admin document:", doc.id, data);

        adminsData.push({
          id: doc.id,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          role: data.role || "admin",
          status: data.status || "active",
          permissions: data.permissions || {
            canApproveSellers: false,
            canApproveDrivers: false,
            canApproveDeliveryAgents: false,
            canViewAnalytics: false,
            canViewAuditLogs: false,
          },
          createdAt: data.createdAt?.toDate?.() || new Date(),
          createdBy: data.createdBy || "system",
          stats: data.stats || {
            totalApprovalsThisMonth: 0,
            totalRejectionsThisMonth: 0,
            averageApprovalTime: 0,
          },
        });
      });

      console.log("Loaded admins:", adminsData);
      setAdmins(adminsData);
    } catch (error) {
      console.error("Error loading admins from Firestore:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to load admins: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // FILTER ADMINS
  const filteredAdmins = admins.filter((admin) => {
    return (
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // HANDLE CREATE ADMIN
  const handleCreateAdmin = async () => {
    try {
      // VALIDATE
      if (!formData.name || !formData.email || !formData.phone) {
        toast.error("Please fill all required fields");
        return;
      }

      if (!formData.email.includes("@")) {
        toast.error("Please enter valid email");
        return;
      }

      setCreatingAdmin(true);
      const currentUser = getCurrentUser();

      if (!currentUser) {
        toast.error("You are not authenticated");
        return;
      }

      console.log("Creating admin:", formData);

      // CREATE IN /admins COLLECTION
      const adminsRef = collection(db, "admins");
      const newAdminRef = await addDoc(adminsRef, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: "active",
        permissions: formData.permissions,
        isOnline: false,
        createdAt: serverTimestamp(),
        createdBy: currentUser.email,
        stats: {
          totalApprovalsThisMonth: 0,
          totalRejectionsThisMonth: 0,
          averageApprovalTime: 0,
        },
      });

      console.log("Admin created with ID:", newAdminRef.id);

      // ALSO CREATE IN /users COLLECTION (for authentication)
      const usersRef = collection(db, "users");
      await addDoc(usersRef, {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        profileImage: "",
        verificationStatus: "verified",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("User document also created");

      const tempPassword = `Temp@${Math.random().toString(36).substr(2, 9)}`;
      console.log("Generated temp password for:", formData.email);

      const authResult = await createAdminAuthUser(
        formData.email,
        tempPassword
      );
      console.log("Auth user created:", authResult);
      if (authResult) {
        console.log("Auth user created:", authResult.uid);
        toast.success("auth user created! password reset email sent.");
      }

      // ADD TO LOCAL STATE
      const newAdmin: AdminUser = {
        id: newAdminRef.id,
        ...formData,
        status: "active",
        createdAt: new Date(),
        createdBy: currentUser.email || "system",
        stats: {
          totalApprovalsThisMonth: 0,
          totalRejectionsThisMonth: 0,
          averageApprovalTime: 0,
        },
      };

      setAdmins([...admins, newAdmin]);

      // RESET FORM
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "admin",
        permissions: {
          canApproveSellers: true,
          canApproveDrivers: true,
          canApproveDeliveryAgents: true,
          canViewAnalytics: true,
          canViewAuditLogs: true,
        },
      });

      setShowCreateForm(false);

      toast.success(
        `Admin "${formData.name}" created successfully! ✅\n\nIMPORTANT: The new admin needs to complete first login setup at http://localhost:3000/auth/login`
      );
    } catch (error) {
      console.error("Error creating admin:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to create admin: " + errorMessage);
    } finally {
      setCreatingAdmin(false);
    }
  };

  // HANDLE DELETE ADMIN
  const handleDelete = async (adminId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this admin? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      console.log("Deleting admin:", adminId);

      // DELETE FROM /admins COLLECTION
      const adminRef = doc(db, "admins", adminId);
      await deleteDoc(adminRef);

      console.log("Admin deleted from /admins");

      // ALSO DELETE FROM /users IF IT EXISTS
      const userDoc = admins.find((a) => a.id === adminId);
      if (userDoc) {
        try {
          const usersRef = collection(db, "users");
          const querySnapshot = await getDocs(usersRef);
          querySnapshot.forEach(async (userDocSnap) => {
            if (userDocSnap.data().email === userDoc.email) {
              await deleteDoc(userDocSnap.ref);
              console.log("User document also deleted");
            }
          });
        } catch (err) {
          console.error("Error deleting user document:", err);
        }
      }

      setAdmins(admins.filter((a) => a.id !== adminId));
      toast.success("Admin deleted successfully! ❌");
    } catch (error) {
      console.error("Error deleting admin:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to delete admin: " + errorMessage);
    }
  };

  // HANDLE SUSPEND ADMIN
  const handleSuspend = async (adminId: string) => {
    try {
      console.log("Suspending admin:", adminId);

      const admin = admins.find((a) => a.id === adminId);
      if (!admin) return;

      const newStatus = admin.status === "suspended" ? "active" : "suspended";

      // UPDATE IN /admins COLLECTION
      const adminRef = doc(db, "admins", adminId);
      await updateDoc(adminRef, { status: newStatus });

      console.log("Admin status updated to:", newStatus);

      // UPDATE LOCAL STATE
      setAdmins(
        admins.map((a) => (a.id === adminId ? { ...a, status: newStatus } : a))
      );

      toast.success(
        admin.status === "suspended"
          ? "Admin reactivated! ✅"
          : "Admin suspended! 🔒"
      );
    } catch (error) {
      console.error("Error suspending admin:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to update admin status: " + errorMessage);
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading admins from Firestore...</p>
        </div>
      </div>
    );
  }

  // RENDER PAGE
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Management
          </h1>
          <p className="text-gray-600">
            Create, edit, and manage admin accounts (Super Admin Only)
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
          disabled={creatingAdmin}
        >
          + Create New Admin
        </button>
      </div>

      {/* CREATE ADMIN FORM */}
      {showCreateForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Create New Admin
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={creatingAdmin}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={creatingAdmin}
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={creatingAdmin}
            />
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as "admin" | "moderator",
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={creatingAdmin}
            >
              <option value="admin">Admin (Full Access)</option>
              <option value="moderator">Moderator (Limited Access)</option>
            </select>
          </div>

          {/* PERMISSIONS */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Permissions:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  key: "canApproveSellers",
                  label: "Can Approve Sellers",
                },
                {
                  key: "canApproveDrivers",
                  label: "Can Approve Drivers",
                },
                {
                  key: "canApproveDeliveryAgents",
                  label: "Can Approve Delivery Agents",
                },
                { key: "canViewAnalytics", label: "Can View Analytics" },
                { key: "canViewAuditLogs", label: "Can View Audit Logs" },
              ].map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={
                      formData.permissions[
                        perm.key as keyof typeof formData.permissions
                      ]
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          [perm.key]: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4"
                    disabled={creatingAdmin}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {perm.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* INFO BOX */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-900 text-sm">
              ℹ️ <strong>Important:</strong> The new admin will need to login at
              <br />
              <code className="bg-blue-100 px-2 py-1 rounded">
                http://localhost:3000/auth/login
              </code>
              <br />
              and set their own password on first login.
            </p>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateForm(false)}
              className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
              disabled={creatingAdmin}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAdmin}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={creatingAdmin}
            >
              {creatingAdmin ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Creating...
                </>
              ) : (
                "✅ Create Admin"
              )}
            </button>
          </div>
        </div>
      )}

      {/* SEARCH */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Admins</p>
          <p className="text-2xl font-bold text-orange-500">{admins.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Active Admins</p>
          <p className="text-2xl font-bold text-green-500">
            {admins.filter((a) => a.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Approvals This Month</p>
          <p className="text-2xl font-bold text-blue-500">
            {admins.reduce(
              (acc, a) => acc + a.stats.totalApprovalsThisMonth,
              0
            )}
          </p>
        </div>
      </div>

      {/* ADMINS LIST */}
      {filteredAdmins.length > 0 ? (
        <div className="space-y-4">
          {filteredAdmins.map((admin) => (
            <div
              key={admin.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl font-bold text-orange-600">
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {admin.name}
                    </h3>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                    <p className="text-sm text-gray-600">{admin.phone}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {admin.role === "admin" ? "🔑 Admin" : "👤 Moderator"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          admin.status === "active"
                            ? "bg-green-100 text-green-800"
                            : admin.status === "inactive"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {admin.status === "active"
                          ? "🟢 Active"
                          : admin.status === "inactive"
                          ? "⚪ Inactive"
                          : "🚫 Suspended"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-2">
                    Created: {admin.createdAt.toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSuspend(admin.id)}
                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded transition-colors"
                    >
                      {admin.status === "suspended" ? "Reactivate" : "Suspend"}
                    </button>
                    <button
                      onClick={() => handleDelete(admin.id)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* STATS */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Approvals</p>
                    <p className="text-lg font-bold text-gray-900">
                      {admin.stats.totalApprovalsThisMonth}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Rejections</p>
                    <p className="text-lg font-bold text-gray-900">
                      {admin.stats.totalRejectionsThisMonth}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Avg Time</p>
                    <p className="text-lg font-bold text-gray-900">
                      {admin.stats.averageApprovalTime}h
                    </p>
                  </div>
                </div>
              </div>

              {/* PERMISSIONS */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Permissions:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(admin.permissions).map(([perm, has]) => (
                    <div
                      key={perm}
                      className={`px-2 py-1 rounded text-xs font-medium text-center ${
                        has
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {has ? "✅" : "❌"}{" "}
                      {perm
                        .replace(/^can/, "")
                        .replace(/([A-Z])/g, " $1")
                        .trim()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-gray-600 font-medium">No admins found</p>
          {admins.length > 0 && (
            <p className="text-gray-500 text-sm mt-1">
              Try adjusting your search query
            </p>
          )}
        </div>
      )}

      {/* INFO BOX */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-900 font-semibold mb-2">💡 Admin Management</p>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>✅ Super Admin (you) has full control over all admins</li>
          <li>✅ Regular Admins can approve/reject verifications</li>
          <li>✅ Moderators can only view data and analytics</li>
          <li>✅ You can suspend admins without deleting their account</li>
          <li>✅ All admin actions are logged in the audit trail</li>
          <li>✅ New admins will see their data after first login</li>
        </ul>
      </div>
    </div>
  );
}
