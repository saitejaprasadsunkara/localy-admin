// app/dashboard/verifications/page.tsx
/**
 * 🔥 UNIVERSAL VERIFICATION PAGE
 * Shows ALL pending verifications: Sellers, Drivers, Delivery Agents
 * Admins can filter by role and approve/reject
 */

"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  Timestamp,
  addDoc,
  getFirestore,
} from "firebase/firestore";
import { auth } from "../../../lib/firebase";

interface VerificationRequest {
  id: string;
  userId: string;
  userRole: string;
  sellerType?: string;
  vehicleType?: string;
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  businessAddress?: string;
  status: "pending" | "under_review" | "verified" | "rejected";
  documents: Record<string, unknown>;
  submittedAt: Date;
  rejectionReason?: string;
}

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [selectedVerification, setSelectedVerification] =
    useState<VerificationRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // 🔥 LOAD ALL PENDING VERIFICATIONS
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      console.log("Loading ALL pending verifications...");

      const verificationRef = collection(
        getFirestore(),
        "verificationRequests"
      );
      const q = query(
        verificationRef,
        where("status", "in", ["pending", "under_review"])
      );

      const querySnapshot = await getDocs(q);

      const verificationsData: VerificationRequest[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        console.log("Verification found:", data);

        const userName = data.name || data.email?.split("@")[0] || "Unknown";

        verificationsData.push({
          id: docSnap.id,
          userId: data.userId || "",
          userRole: data.userRole || "unknown",
          sellerType: data.sellerType,
          vehicleType: data.vehicleType,
          name: userName,
          email: data.email || "",
          phone: data.phone || "",
          businessName: data.businessName,
          businessAddress: data.businessAddress,
          status: data.status || "pending",
          documents: data.documents || {},
          submittedAt: data.submittedAt?.toDate?.() || new Date(),
          rejectionReason: data.rejectionReason,
        });
      });

      console.log("✅ Loaded verifications:", verificationsData);
      setVerifications(verificationsData);
    } catch (error) {
      console.error("Error loading verifications:", error);
      toast.error("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 APPROVE VERIFICATION
  // ═══════════════════════════════════════════════════════════
  const handleApprove = async () => {
    if (!selectedVerification) return;

    try {
      setActionLoading(true);
      const db = getFirestore();
      const admin = auth.currentUser;

      if (!admin) {
        toast.error("Admin not authenticated");
        return;
      }

      console.log("Approving verification:", selectedVerification.userId);

      // Update verification request status
      await updateDoc(
        doc(db, "verificationRequests", selectedVerification.id),
        {
          status: "verified",
          reviewedAt: Timestamp.now(),
          reviewedBy: admin.email,
          updatedAt: Timestamp.now(),
        }
      );

      // Update user verification status
      await updateDoc(doc(db, "users", selectedVerification.userId), {
        verificationStatus: "verified",
        updatedAt: Timestamp.now(),
      });

      // Create notification for user
      const roleLabel =
        selectedVerification.userRole === "seller"
          ? selectedVerification.sellerType?.replace("_", " ") || "Seller"
          : selectedVerification.userRole === "driver"
          ? selectedVerification.vehicleType?.replace("_", " ") || "Driver"
          : "Delivery Agent";

      await addDoc(collection(db, "notifications"), {
        userId: selectedVerification.userId,
        type: "verification_approved",
        title: "🎉 Verification Approved!",
        message: `Your ${roleLabel} account has been verified. You can now start operating!`,
        read: false,
        createdAt: Timestamp.now(),
      });

      console.log("✅ Verification approved successfully");
      toast.success(`${selectedVerification.name} verified!`);
      setShowApprovalModal(false);
      setSelectedVerification(null);

      // Reload
      loadVerifications();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Failed to approve verification");
    } finally {
      setActionLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 REJECT VERIFICATION
  // ═══════════════════════════════════════════════════════════
  const handleReject = async () => {
    if (!selectedVerification || !rejectionReason.trim()) {
      toast.error("Please enter rejection reason");
      return;
    }

    try {
      setActionLoading(true);
      const db = getFirestore();
      const admin = auth.currentUser;

      if (!admin) {
        toast.error("Admin not authenticated");
        return;
      }

      console.log("Rejecting verification:", selectedVerification.userId);

      // Update verification request status
      await updateDoc(
        doc(db, "verificationRequests", selectedVerification.id),
        {
          status: "rejected",
          rejectionReason: rejectionReason.trim(),
          reviewedAt: Timestamp.now(),
          reviewedBy: admin.email,
          updatedAt: Timestamp.now(),
        }
      );

      // Update user verification status
      await updateDoc(doc(db, "users", selectedVerification.userId), {
        verificationStatus: "rejected",
        updatedAt: Timestamp.now(),
      });

      // Create notification for user
      await addDoc(collection(db, "notifications"), {
        userId: selectedVerification.userId,
        type: "verification_rejected",
        title: "❌ Verification Rejected",
        message: `Your verification was rejected. Reason: ${rejectionReason}`,
        read: false,
        createdAt: Timestamp.now(),
      });

      console.log("✅ Verification rejected successfully");
      toast.success("Verification rejected. Notification sent to user.");
      setShowRejectionModal(false);
      setRejectionReason("");
      setSelectedVerification(null);

      // Reload
      loadVerifications();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Failed to reject verification");
    } finally {
      setActionLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 FILTER VERIFICATIONS
  // ═══════════════════════════════════════════════════════════
  const filteredVerifications = verifications.filter((v) => {
    // Filter by role
    if (filterRole !== "all" && v.userRole !== filterRole) {
      return false;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(query) ||
        v.email.toLowerCase().includes(query) ||
        (v.businessName?.toLowerCase().includes(query) ?? false)
      );
    }

    return true;
  });

  // Get role stats
  const getStats = () => {
    const pending = verifications.filter((v) => v.status === "pending").length;
    const underReview = verifications.filter(
      (v) => v.status === "under_review"
    ).length;
    const sellers = verifications.filter((v) => v.userRole === "seller").length;
    const drivers = verifications.filter((v) => v.userRole === "driver").length;
    const agents = verifications.filter(
      (v) => v.userRole === "delivery_agent"
    ).length;

    return { pending, underReview, sellers, drivers, agents };
  };

  const stats = getStats();

  // ═══════════════════════════════════════════════════════════
  // 🔥 RENDER LOADING STATE
  // ═══════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading verifications...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 RENDER PAGE
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            All Pending Verifications
          </h1>
          <p className="text-gray-600">
            Review and approve all seller, driver, and delivery agent
            verifications
          </p>
        </div>
        <button
          onClick={loadVerifications}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg"
        >
          🔄 Refresh
        </button>
      </div>

      {/* SEARCH & FILTER */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <input
          type="text"
          placeholder="Search by name, email, or business name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        <div className="flex gap-2 flex-wrap">
          {["all", "seller", "driver", "delivery_agent"].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterRole === role
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {role === "all"
                ? "All Roles"
                : role === "delivery_agent"
                ? "Delivery Agents"
                : role.charAt(0).toUpperCase() + role.slice(1) + "s"}
            </button>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Pending</p>
          <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Under Review</p>
          <p className="text-2xl font-bold text-blue-500">
            {stats.underReview}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Sellers</p>
          <p className="text-2xl font-bold text-green-500">{stats.sellers}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Drivers</p>
          <p className="text-2xl font-bold text-purple-500">{stats.drivers}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Delivery Agents</p>
          <p className="text-2xl font-bold text-red-500">{stats.agents}</p>
        </div>
      </div>

      {/* VERIFICATIONS LIST */}
      {filteredVerifications.length > 0 ? (
        <div className="space-y-4">
          {filteredVerifications.map((verification) => (
            <div
              key={verification.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {verification.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        verification.userRole === "seller"
                          ? "bg-green-100 text-green-800"
                          : verification.userRole === "driver"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {verification.userRole === "delivery_agent"
                        ? "Delivery Agent"
                        : verification.userRole.charAt(0).toUpperCase() +
                          verification.userRole.slice(1)}
                    </span>
                    {verification.sellerType && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {verification.sellerType.replace("_", " ")}
                      </span>
                    )}
                    {verification.vehicleType && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {verification.vehicleType.replace("_", " ")}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-1">
                    Email: {verification.email}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    Phone: {verification.phone}
                  </p>

                  {verification.businessName && (
                    <p className="text-sm text-gray-600">
                      Business: {verification.businessName}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-4">
                    Submitted:{" "}
                    {verification.submittedAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedVerification(verification);
                        setShowApprovalModal(true);
                      }}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-sm"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVerification(verification);
                        setShowRejectionModal(true);
                      }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>

              {/* DOCUMENTS */}
              {Object.keys(verification.documents).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Documents Uploaded:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(verification.documents || {}).map(
                      ([docName]) => (
                        <div
                          key={docName}
                          className="px-3 py-2 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center gap-2"
                        >
                          <span>✅</span>
                          <span className="truncate">
                            {docName.replace(/_/g, " ")}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* REJECTION REASON */}
              {verification.status === "rejected" &&
                verification.rejectionReason && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm">
                      <strong>Rejection Reason:</strong>{" "}
                      <span className="text-red-600">
                        {verification.rejectionReason}
                      </span>
                    </p>
                  </div>
                )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-gray-600 font-medium">No pending verifications</p>
          {verifications.length > 0 && (
            <p className="text-gray-500 text-sm mt-1">
              All verifications have been reviewed!
            </p>
          )}
        </div>
      )}

      {/* APPROVAL MODAL */}
      {showApprovalModal && selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Approval
            </h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to approve{" "}
              <strong>{selectedVerification.name}</strong> (
              {selectedVerification.userRole.charAt(0).toUpperCase() +
                selectedVerification.userRole.slice(1)}
              )?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? "⏳ Approving..." : "✅ Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {showRejectionModal && selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Reject Verification
            </h2>
            <p className="text-gray-600 mb-4">
              Why are you rejecting {selectedVerification.name}?
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg disabled:opacity-50"
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? "⏳ Rejecting..." : "❌ Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// // app/dashboard/pending-verifications/page.tsx
// /**
//  * 🔥 UNIVERSAL VERIFICATION PAGE
//  * Shows ALL pending verifications: Sellers, Drivers, Delivery Agents
//  * Admin Portal: webapp-1071a
//  */

// "use client";

// import React, { useState, useEffect } from "react";
// import toast from "react-hot-toast";
// import {
//   collection,
//   getDocs,
//   query,
//   where,
//   doc,
//   updateDoc,
//   Timestamp,
//   addDoc,
// } from "firebase/firestore";
// import { auth, db } from "../../../lib/firebase";

// interface VerificationRequest {
//   id: string;
//   userId: string;
//   userRole: string;
//   sellerType?: string;
//   vehicleType?: string;
//   name: string;
//   email: string;
//   phone: string;
//   businessName?: string;
//   businessAddress?: string;
//   status: "pending" | "under_review" | "verified" | "rejected";
//   documents: Record<string, string>;
//   submittedAt: Date;
//   rejectionReason?: string;
// }

// export default function PendingVerificationsPage() {
//   const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filterRole, setFilterRole] = useState<string>("all"); // all, seller, driver, delivery_agent
//   const [selectedVerification, setSelectedVerification] =
//     useState<VerificationRequest | null>(null);
//   const [showApprovalModal, setShowApprovalModal] = useState(false);
//   const [showRejectionModal, setShowRejectionModal] = useState(false);
//   const [rejectionReason, setRejectionReason] = useState("");
//   const [actionLoading, setActionLoading] = useState(false);

//   // ═══════════════════════════════════════════════════════════
//   // 🔥 LOAD ALL PENDING VERIFICATIONS
//   // ═══════════════════════════════════════════════════════════
//   useEffect(() => {
//     loadVerifications();
//   }, []);

//   const loadVerifications = async () => {
//     try {
//       setLoading(true);
//       console.log("Loading ALL pending verifications...");

//       const verificationRef = collection(db, "verificationRequests");

//       // Query for pending OR under_review (not verified or rejected)
//       const q = query(
//         verificationRef,
//         where("status", "in", ["pending", "under_review"])
//       );

//       const querySnapshot = await getDocs(q);

//       const verificationsData: VerificationRequest[] = [];

//       querySnapshot.forEach((docSnap) => {
//         const data = docSnap.data();
//         console.log("Verification found:", data);

//         // Get user name from document or use email
//         const userName = data.name || data.email?.split("@")[0] || "Unknown";

//         verificationsData.push({
//           id: docSnap.id,
//           userId: data.userId || "",
//           userRole: data.userRole || "unknown",
//           sellerType: data.sellerType,
//           vehicleType: data.vehicleType,
//           name: userName,
//           email: data.email || "",
//           phone: data.phone || "",
//           businessName: data.businessName,
//           businessAddress: data.businessAddress,
//           status: data.status || "pending",
//           documents: data.documents || {},
//           submittedAt: data.submittedAt?.toDate?.() || new Date(),
//           rejectionReason: data.rejectionReason,
//         });
//       });

//       console.log("✅ Loaded verifications:", verificationsData);
//       setVerifications(verificationsData);
//     } catch (error) {
//       console.error("Error loading verifications:", error);
//       toast.error(
//         "Failed to load verifications: " + (error as unknown as Error).message
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ═══════════════════════════════════════════════════════════
//   // 🔥 APPROVE VERIFICATION
//   // ═══════════════════════════════════════════════════════════
//   const handleApprove = async () => {
//     if (!selectedVerification) return;

//     try {
//       setActionLoading(true);
//       const admin = auth.currentUser;

//       if (!admin) {
//         toast.error("Admin not authenticated");
//         return;
//       }

//       console.log("Approving verification:", selectedVerification.userId);

//       // Update verification request status
//       await updateDoc(
//         doc(db, "verificationRequests", selectedVerification.id),
//         {
//           status: "verified",
//           reviewedAt: Timestamp.now(),
//           reviewedBy: admin.email,
//           updatedAt: Timestamp.now(),
//         }
//       );

//       // Update user verification status
//       await updateDoc(doc(db, "users", selectedVerification.userId), {
//         verificationStatus: "verified",
//         updatedAt: Timestamp.now(),
//       });

//       // Create notification for user
//       const roleLabel =
//         selectedVerification.userRole === "seller"
//           ? selectedVerification.sellerType?.replace("_", " ") || "Seller"
//           : selectedVerification.userRole?.replace("_", " ") || "User";

//       await addDoc(collection(db, "notifications"), {
//         userId: selectedVerification.userId,
//         type: "verification_approved",
//         title: "🎉 Verification Approved!",
//         message: `Your ${roleLabel} account has been verified. You can now start operating!`,
//         read: false,
//         createdAt: Timestamp.now(),
//       });

//       console.log("✅ Verification approved successfully");

//       toast.success(
//         `${selectedVerification.name} (${selectedVerification.userRole}) verified!`
//       );
//       setShowApprovalModal(false);
//       setSelectedVerification(null);

//       // Reload
//       loadVerifications();
//     } catch (error) {
//       console.error("Error approving:", error);
//       toast.error("Failed to approve: " + (error as unknown as Error).message);
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   // ═══════════════════════════════════════════════════════════
//   // 🔥 REJECT VERIFICATION
//   // ═══════════════════════════════════════════════════════════
//   const handleReject = async () => {
//     if (!selectedVerification || !rejectionReason.trim()) {
//       toast.error("Please enter rejection reason");
//       return;
//     }

//     try {
//       setActionLoading(true);
//       const admin = auth.currentUser;

//       if (!admin) {
//         toast.error("Admin not authenticated");
//         return;
//       }

//       console.log("Rejecting verification:", selectedVerification.userId);

//       // Update verification request status
//       await updateDoc(
//         doc(db, "verificationRequests", selectedVerification.id),
//         {
//           status: "rejected",
//           rejectionReason: rejectionReason.trim(),
//           reviewedAt: Timestamp.now(),
//           reviewedBy: admin.email,
//           updatedAt: Timestamp.now(),
//         }
//       );

//       // Update user verification status
//       await updateDoc(doc(db, "users", selectedVerification.userId), {
//         verificationStatus: "rejected",
//         updatedAt: Timestamp.now(),
//       });

//       // Create notification for user
//       await addDoc(collection(db, "notifications"), {
//         userId: selectedVerification.userId,
//         type: "verification_rejected",
//         title: "❌ Verification Rejected",
//         message: `Your verification was rejected. Reason: ${rejectionReason}`,
//         read: false,
//         createdAt: Timestamp.now(),
//       });

//       console.log("✅ Verification rejected successfully");

//       toast.success("Verification rejected. Notification sent to user.");
//       setShowRejectionModal(false);
//       setRejectionReason("");
//       setSelectedVerification(null);

//       // Reload
//       loadVerifications();
//     } catch (error) {
//       console.error("Error rejecting:", error);
//       toast.error("Failed to reject: " + (error as unknown as Error).message);
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   // ═══════════════════════════════════════════════════════════
//   // 🔥 FILTER VERIFICATIONS
//   // ═══════════════════════════════════════════════════════════
//   const filteredVerifications = verifications.filter((v) => {
//     // Filter by role
//     if (filterRole !== "all" && v.userRole !== filterRole) {
//       return false;
//     }

//     // Filter by search
//     if (searchQuery) {
//       const query = searchQuery.toLowerCase();
//       return (
//         v.name.toLowerCase().includes(query) ||
//         v.email.toLowerCase().includes(query) ||
//         (v.businessName?.toLowerCase().includes(query) ?? false)
//       );
//     }

//     return true;
//   });

//   // Get role stats
//   const getStats = () => {
//     const pending = verifications.filter((v) => v.status === "pending").length;
//     const underReview = verifications.filter(
//       (v) => v.status === "under_review"
//     ).length;
//     const sellers = verifications.filter((v) => v.userRole === "seller").length;
//     const drivers = verifications.filter((v) => v.userRole === "driver").length;
//     const agents = verifications.filter(
//       (v) => v.userRole === "delivery_agent"
//     ).length;

//     return { pending, underReview, sellers, drivers, agents };
//   };

//   const stats = getStats();

//   // ═══════════════════════════════════════════════════════════
//   // 🔥 RENDER LOADING STATE
//   // ═══════════════════════════════════════════════════════════
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin text-4xl mb-4">⏳</div>
//           <p className="text-gray-600">Loading verifications...</p>
//         </div>
//       </div>
//     );
//   }

//   // ═══════════════════════════════════════════════════════════
//   // 🔥 RENDER PAGE
//   // ═══════════════════════════════════════════════════════════
//   return (
//     <div className="space-y-6">
//       {/* HEADER */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             All Pending Verifications
//           </h1>
//           <p className="text-gray-600">
//             Review and approve seller, driver, and delivery agent verifications
//           </p>
//         </div>
//         <button
//           onClick={loadVerifications}
//           className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg"
//         >
//           🔄 Refresh
//         </button>
//       </div>

//       {/* SEARCH & FILTER */}
//       <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
//         <input
//           type="text"
//           placeholder="Search by name, email, or business name..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
//         />

//         <div className="flex gap-2 flex-wrap">
//           {["all", "seller", "driver", "delivery_agent"].map((role) => (
//             <button
//               key={role}
//               onClick={() => setFilterRole(role)}
//               className={`px-4 py-2 rounded-lg font-medium transition ${
//                 filterRole === role
//                   ? "bg-orange-500 text-white"
//                   : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//               }`}
//             >
//               {role === "all"
//                 ? "All Roles"
//                 : role === "delivery_agent"
//                 ? "Delivery Agents"
//                 : role.charAt(0).toUpperCase() + role.slice(1) + "s"}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* STATS */}
//       <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <p className="text-gray-600 text-sm">Total Pending</p>
//           <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
//         </div>
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <p className="text-gray-600 text-sm">Under Review</p>
//           <p className="text-2xl font-bold text-blue-500">
//             {stats.underReview}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <p className="text-gray-600 text-sm">Sellers</p>
//           <p className="text-2xl font-bold text-green-500">{stats.sellers}</p>
//         </div>
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <p className="text-gray-600 text-sm">Drivers</p>
//           <p className="text-2xl font-bold text-purple-500">{stats.drivers}</p>
//         </div>
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <p className="text-gray-600 text-sm">Delivery Agents</p>
//           <p className="text-2xl font-bold text-red-500">{stats.agents}</p>
//         </div>
//       </div>

//       {/* VERIFICATIONS LIST */}
//       {filteredVerifications.length > 0 ? (
//         <div className="space-y-4">
//           {filteredVerifications.map((verification) => (
//             <div
//               key={verification.id}
//               className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
//             >
//               <div className="flex items-start justify-between mb-4">
//                 <div>
//                   <div className="flex items-center gap-3 mb-2">
//                     <h3 className="text-lg font-semibold text-gray-900">
//                       {verification.name}
//                     </h3>
//                     <span
//                       className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                         verification.userRole === "seller"
//                           ? "bg-green-100 text-green-800"
//                           : verification.userRole === "driver"
//                           ? "bg-purple-100 text-purple-800"
//                           : "bg-red-100 text-red-800"
//                       }`}
//                     >
//                       {verification.userRole === "delivery_agent"
//                         ? "Delivery Agent"
//                         : verification.userRole.charAt(0).toUpperCase() +
//                           verification.userRole.slice(1)}
//                     </span>
//                     {verification.sellerType && (
//                       <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
//                         {verification.sellerType.replace("_", " ")}
//                       </span>
//                     )}
//                   </div>

//                   <p className="text-sm text-gray-600 mb-1">
//                     Email: {verification.email}
//                   </p>
//                   <p className="text-sm text-gray-600 mb-1">
//                     Phone: {verification.phone}
//                   </p>

//                   {verification.businessName && (
//                     <p className="text-sm text-gray-600">
//                       Business: {verification.businessName}
//                     </p>
//                   )}
//                 </div>

//                 <div className="text-right">
//                   <p className="text-sm text-gray-600 mb-4">
//                     Submitted:{" "}
//                     {verification.submittedAt.toLocaleDateString("en-US", {
//                       month: "short",
//                       day: "numeric",
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     })}
//                   </p>
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => {
//                         setSelectedVerification(verification);
//                         setShowApprovalModal(true);
//                       }}
//                       className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-sm"
//                     >
//                       ✅ Approve
//                     </button>
//                     <button
//                       onClick={() => {
//                         setSelectedVerification(verification);
//                         setShowRejectionModal(true);
//                       }}
//                       className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm"
//                     >
//                       ❌ Reject
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* DOCUMENTS */}
//               {Object.keys(verification.documents).length > 0 && (
//                 <div className="bg-gray-50 rounded-lg p-4">
//                   <p className="text-sm font-semibold text-gray-900 mb-3">
//                     Documents Uploaded:
//                   </p>
//                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//                     {Object.entries(verification.documents).map(
//                       ([docName, docData]: [string, unknown]) => (
//                         <a
//                           key={docName}
//                           href={(docData as { url: string }).url}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="px-3 py-2 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center gap-2 hover:bg-green-200"
//                         >
//                           <span>✅</span>
//                           <span className="truncate">
//                             {docName.replace(/_/g, " ")}
//                           </span>
//                         </a>
//                       )
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* REJECTION REASON */}
//               {verification.status === "rejected" &&
//                 verification.rejectionReason && (
//                   <div className="mt-3 pt-3 border-t border-gray-200">
//                     <p className="text-sm">
//                       <strong>Rejection Reason:</strong>{" "}
//                       <span className="text-red-600">
//                         {verification.rejectionReason}
//                       </span>
//                     </p>
//                   </div>
//                 )}
//             </div>
//           ))}
//         </div>
//       ) : (
//         <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
//           <p className="text-2xl mb-2">📭</p>
//           <p className="text-gray-600 font-medium">No pending verifications</p>
//           {verifications.length > 0 && (
//             <p className="text-gray-500 text-sm mt-1">
//               All verifications have been reviewed!
//             </p>
//           )}
//         </div>
//       )}

//       {/* APPROVAL MODAL */}
//       {showApprovalModal && selectedVerification && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
//             <h2 className="text-xl font-bold text-gray-900 mb-4">
//               Confirm Approval
//             </h2>
//             <p className="text-gray-600 mb-4">
//               Are you sure you want to approve{" "}
//               <strong>{selectedVerification.name}</strong> (
//               {selectedVerification.userRole})? They will immediately be able to
//               start operating on Localy.
//             </p>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => setShowApprovalModal(false)}
//                 className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg"
//                 disabled={actionLoading}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleApprove}
//                 className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50"
//                 disabled={actionLoading}
//               >
//                 {actionLoading ? "⏳ Approving..." : "✅ Approve"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* REJECTION MODAL */}
//       {showRejectionModal && selectedVerification && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
//             <h2 className="text-xl font-bold text-gray-900 mb-4">
//               Reject Verification
//             </h2>
//             <p className="text-gray-600 mb-4">
//               Why are you rejecting {selectedVerification.name}?
//             </p>
//             <textarea
//               value={rejectionReason}
//               onChange={(e) => setRejectionReason(e.target.value)}
//               placeholder="Enter reason for rejection..."
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
//               rows={4}
//             />
//             <div className="flex gap-3">
//               <button
//                 onClick={() => {
//                   setShowRejectionModal(false);
//                   setRejectionReason("");
//                 }}
//                 className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg"
//                 disabled={actionLoading}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleReject}
//                 className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg disabled:opacity-50"
//                 disabled={actionLoading || !rejectionReason.trim()}
//               >
//                 {actionLoading ? "⏳ Rejecting..." : "❌ Reject"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
