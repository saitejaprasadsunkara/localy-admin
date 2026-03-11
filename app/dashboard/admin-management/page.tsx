// app/dashboard/admin-manage/page.tsx
/**
 * Admin Management Page
 * Super Admin can create, view, and manage other admins
 */

"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "../../../lib/firebase";

import { createAdminAuthUser } from "../../../lib/auth-admin";

import { isSuperAdminUser } from "../../../lib/auth";

import { auth } from "../../../lib/firebase";
import toast from "react-hot-toast";

interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "super_admin";
  status: "active" | "inactive";
  createdAt: Date;
  createdBy: string;
  permissions?: {
    canApproveVerifications: boolean;
    canCreateAdmins: boolean;
    canDeleteAdmins: boolean;
    canViewAnalytics: boolean;
    canManageSettings: boolean;
  };
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // CHECK IF USER IS SUPER ADMIN
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    checkSuperAdminAccess();
    loadAdmins();
  }, []);

  const checkSuperAdminAccess = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Not authenticated");
        return;
      }

      const isSuperAdminUser_ = await isSuperAdminUser(currentUser.uid);
      if (!isSuperAdminUser_) {
        toast.error("Access denied. Only super admins can manage admins.");
        // Redirect or disable page
      }
      setIsSuperAdmin(isSuperAdminUser_);
    } catch (error) {
      console.error("Error checking super admin access:", error);
      toast.error("Error checking permissions");
    }
  };

  // ═══════════════════════════════════════════════════════════
  // LOAD ALL ADMINS
  // ═══════════════════════════════════════════════════════════
  const loadAdmins = async () => {
    try {
      setLoading(true);
      console.log("Loading all admins from /admins collection...");

      const adminsRef = collection(db, "admins");
      // Get all admins (you can add pagination if needed)
      const q = query(adminsRef);
      const querySnapshot = await getDocs(q);

      const adminsList: AdminUser[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        adminsList.push({
          uid: doc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          status: data.status,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
          permissions: data.permissions,
        });
      });

      console.log("✅ Loaded admins:", adminsList);
      setAdmins(adminsList);
    } catch (error) {
      console.error("Error loading admins:", error);
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // CREATE NEW ADMIN
  // ═══════════════════════════════════════════════════════════
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAdminEmail || !newAdminPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newAdminPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setIsCreating(true);
      console.log("Creating new admin:", newAdminEmail);

      const result = await createAdminAuthUser(
        newAdminEmail,
        newAdminPassword,
        "admin" // Create as regular admin (super admin can change later)
      );

      if (result) {
        console.log("✅ Admin created successfully");
        toast.success(
          `Admin created! Password reset email sent to ${newAdminEmail}`
        );

        // Reset form
        setNewAdminEmail("");
        setNewAdminPassword("");
        setShowCreateModal(false);

        // Reload admins list
        await loadAdmins();
      } else {
        toast.error("Failed to create admin. Email might already be in use.");
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error(
        "Failed to create admin: " +
          (error as unknown as { message: string }).message
      );
    } finally {
      setIsCreating(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600 mb-2">
            ❌ Access Denied
          </p>
          <p className="text-gray-600">
            Only super admins can access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Management
          </h1>
          <p className="text-gray-600">
            Create and manage admin accounts for your platform
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white font-semibold rounded-lg transition-all"
        >
          ➕ Create Admin
        </button>
      </div>

      {/* ADMINS LIST */}
      {admins.length > 0 ? (
        <div className="space-y-4">
          {admins.map((admin) => (
            <div
              key={admin.uid}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {admin.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        admin.role === "super_admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {admin.role === "super_admin"
                        ? "👑 Super Admin"
                        : "👤 Admin"}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        admin.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {admin.status === "active" ? "✅ Active" : "❌ Inactive"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    Email:{" "}
                    <span className="font-mono text-gray-900">
                      {admin.email}
                    </span>
                  </p>

                  {/* PERMISSIONS */}
                  {admin.permissions && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div className="text-xs">
                        <p className="text-gray-500 text-xs">
                          Approve Verifications
                        </p>
                        <p className="font-semibold">
                          {admin.permissions.canApproveVerifications
                            ? "✅"
                            : "❌"}
                        </p>
                      </div>
                      <div className="text-xs">
                        <p className="text-gray-500 text-xs">Create Admins</p>
                        <p className="font-semibold">
                          {admin.permissions.canCreateAdmins ? "✅" : "❌"}
                        </p>
                      </div>
                      <div className="text-xs">
                        <p className="text-gray-500 text-xs">Delete Admins</p>
                        <p className="font-semibold">
                          {admin.permissions.canDeleteAdmins ? "✅" : "❌"}
                        </p>
                      </div>
                      <div className="text-xs">
                        <p className="text-gray-500 text-xs">View Analytics</p>
                        <p className="font-semibold">
                          {admin.permissions.canViewAnalytics ? "✅" : "❌"}
                        </p>
                      </div>
                      <div className="text-xs">
                        <p className="text-gray-500 text-xs">Manage Settings</p>
                        <p className="font-semibold">
                          {admin.permissions.canManageSettings ? "✅" : "❌"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg text-sm">
                    Edit
                  </button>
                  <button className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-900 font-semibold rounded-lg text-sm">
                    Delete
                  </button>
                </div>
              </div>

              {/* CREATED INFO */}
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                Created on{" "}
                {admin.createdAt instanceof Date
                  ? admin.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Unknown"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-2xl mb-2">👥</p>
          <p className="text-gray-600 font-medium">No admins created yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Click Create Admin to add your first admin
          </p>
        </div>
      )}

      {/* CREATE ADMIN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Create New Admin
            </h2>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@localy.me"
                  required
                  disabled={isCreating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temporary Password (min. 8 characters)
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isCreating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Admin will receive password reset email
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Creating...
                    </>
                  ) : (
                    "Create Admin"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
