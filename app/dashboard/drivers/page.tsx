// app/dashboard/drivers/page.tsx
/**
 * Drivers Verification Page
 * Shows pending driver verifications
 * Admins can approve/reject drivers
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

interface DriverVerification {
  id: string;
  userId: string;
  userRole: string;
  vehicleType: string;
  name: string;
  email: string;
  phone: string;
  status: "pending" | "under_review" | "verified" | "rejected";
  documents: Record<string, unknown>;
  submittedAt: Date;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] =
    useState<DriverVerification | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // LOAD DRIVERS FROM FIRESTORE
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      console.log("Loading drivers from Firestore...");

      const verificationRef = collection(
        getFirestore(),
        "verificationRequests"
      );
      const q = query(
        verificationRef,
        where("userRole", "==", "driver"),
        where("status", "in", ["pending", "under_review"])
      );

      const querySnapshot = await getDocs(q);

      const driversData: DriverVerification[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        console.log("Driver verification:", docSnap.id, data);

        driversData.push({
          id: docSnap.id,
          userId: data.userId || "",
          userRole: data.userRole || "",
          vehicleType: data.vehicleType || "",
          name: data.name || "Unknown",
          email: data.email || "",
          phone: data.phone || "",
          status: data.status || "pending",
          documents: data.documents || {},
          submittedAt: data.submittedAt?.toDate?.() || new Date(),
        });
      });

      console.log("✅ Loaded drivers:", driversData);
      setDrivers(driversData);
    } catch (error) {
      console.error("Error loading drivers:", error);
      toast.error("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // APPROVE DRIVER
  // ═══════════════════════════════════════════════════════════
  const handleApproveDriver = async () => {
    if (!selectedDriver) return;

    try {
      setActionLoading(true);
      const db = getFirestore();
      const admin = auth.currentUser;

      if (!admin) {
        toast.error("Admin not authenticated");
        return;
      }

      console.log("Approving driver:", selectedDriver.userId);

      // Update verification request status
      await updateDoc(doc(db, "verificationRequests", selectedDriver.id), {
        status: "verified",
        reviewedAt: Timestamp.now(),
        reviewedBy: admin.email,
        updatedAt: Timestamp.now(),
      });

      // Update user verification status
      await updateDoc(doc(db, "users", selectedDriver.userId), {
        verificationStatus: "verified",
        updatedAt: Timestamp.now(),
      });

      // Create notification for driver
      await addDoc(collection(db, "notifications"), {
        userId: selectedDriver.userId,
        type: "verification_approved",
        title: "🎉 Verification Approved!",
        message: `Your ${selectedDriver.vehicleType.replace(
          "_",
          " "
        )} driver account has been verified. You can now start accepting rides!`,
        read: false,
        createdAt: Timestamp.now(),
      });

      console.log("✅ Driver approved successfully");
      toast.success(`${selectedDriver.name} verified successfully!`);
      setShowApprovalModal(false);
      setSelectedDriver(null);

      // Reload drivers list
      loadDrivers();
    } catch (error) {
      console.error("Error approving driver:", error);
      toast.error("Failed to approve driver");
    } finally {
      setActionLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // REJECT DRIVER
  // ═══════════════════════════════════════════════════════════
  const handleRejectDriver = async () => {
    if (!selectedDriver || !rejectionReason.trim()) {
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

      console.log("Rejecting driver:", selectedDriver.userId);

      // Update verification request status
      await updateDoc(doc(db, "verificationRequests", selectedDriver.id), {
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
        reviewedAt: Timestamp.now(),
        reviewedBy: admin.email,
        updatedAt: Timestamp.now(),
      });

      // Update user verification status
      await updateDoc(doc(db, "users", selectedDriver.userId), {
        verificationStatus: "rejected",
        updatedAt: Timestamp.now(),
      });

      // Create notification for driver
      await addDoc(collection(db, "notifications"), {
        userId: selectedDriver.userId,
        type: "verification_rejected",
        title: "❌ Verification Rejected",
        message: `Your verification was rejected. Reason: ${rejectionReason}`,
        read: false,
        createdAt: Timestamp.now(),
      });

      console.log("✅ Driver rejected successfully");
      toast.success("Driver rejected. Notification sent.");
      setShowRejectionModal(false);
      setRejectionReason("");
      setSelectedDriver(null);

      // Reload drivers list
      loadDrivers();
    } catch (error) {
      console.error("Error rejecting driver:", error);
      toast.error("Failed to reject driver");
    } finally {
      setActionLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // FILTER DRIVERS
  // ═══════════════════════════════════════════════════════════
  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery)
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER LOADING STATE
  // ═══════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading drivers...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER PAGE
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Driver Verifications
          </h1>
          <p className="text-gray-600">
            Review and verify pending driver accounts
          </p>
        </div>
        <button
          onClick={loadDrivers}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg"
        >
          🔄 Refresh
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Pending</p>
          <p className="text-2xl font-bold text-orange-500">
            {drivers.filter((d) => d.status === "pending").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Under Review</p>
          <p className="text-2xl font-bold text-blue-500">
            {drivers.filter((d) => d.status === "under_review").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Drivers</p>
          <p className="text-2xl font-bold text-purple-500">{drivers.length}</p>
        </div>
      </div>

      {/* DRIVERS LIST */}
      {filteredDrivers.length > 0 ? (
        <div className="space-y-4">
          {filteredDrivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {driver.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Email: {driver.email}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Phone: {driver.phone}
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      {driver.vehicleType.replace("_", " ")}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        driver.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {driver.status === "pending"
                        ? "⏳ Pending"
                        : "🔍 Under Review"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-4">
                    Submitted:{" "}
                    {driver.submittedAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        setShowApprovalModal(true);
                      }}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-sm"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
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
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Documents Uploaded:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(driver.documents || {}).map(([docName]) => (
                    <div
                      key={docName}
                      className="px-3 py-2 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center gap-2"
                    >
                      <span>✅</span>
                      {docName.replace(/_/g, " ")}
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
          <p className="text-gray-600 font-medium">No pending drivers</p>
          {drivers.length > 0 && (
            <p className="text-gray-500 text-sm mt-1">
              All drivers have been reviewed!
            </p>
          )}
        </div>
      )}

      {/* APPROVAL MODAL */}
      {showApprovalModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Approval
            </h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to approve{" "}
              <strong>{selectedDriver.name}</strong>?
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
                onClick={handleApproveDriver}
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
      {showRejectionModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Reject Driver
            </h2>
            <p className="text-gray-600 mb-4">
              Why are you rejecting {selectedDriver.name}?
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
                onClick={handleRejectDriver}
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

// // app/dashboard/sellers/page_UPDATED.tsx
// /**
//  * 🔥 SELLERS VERIFICATION PAGE - UPDATED WITH FIRESTORE INTEGRATION
//  * Admin Portal: webapp-1071a
//  *
//  * Shows pending seller verifications from locly-92848 (Mobile App)
//  * Admins can approve/reject sellers
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
//   getFirestore,
// } from "firebase/firestore";
// //import { getMobileAppFirestore } from "../../../lib/firebaseMultiProject";
// import { auth } from "../../../lib/firebase";

// interface SellerVerification {
//   id: string;
//   userId: string;
//   userRole: string;
//   sellerType: string;
//   name: string;
//   email: string;
//   phone: string;
//   businessName: string;
//   businessAddress: string;
//   status: "pending" | "under_review" | "verified" | "rejected";
//   documents: Record<string, string>;
//   submittedAt: Date;
//   createdAt: Date;
// }

// export default function SellersPage() {
//   const [sellers, setSellers] = useState<SellerVerification[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedSeller, setSelectedSeller] =
//     useState<SellerVerification | null>(null);
//   const [showApprovalModal, setShowApprovalModal] = useState(false);
//   const [showRejectionModal, setShowRejectionModal] = useState(false);
//   const [rejectionReason, setRejectionReason] = useState("");
//   const [actionLoading, setActionLoading] = useState(false);

//   // ═══════════════════════════════════════════════════════════
//   // 🔥 LOAD SELLERS FROM MOBILE APP FIRESTORE
//   // ═══════════════════════════════════════════════════════════
//   useEffect(() => {
//     loadSellers();
//   }, []);

//   const loadSellers = async () => {
//     try {
//       setLoading(true);
//       console.log("Loading sellers from locly-92848 Firestore...");

//       // Get Firestore instance from mobile app project
//       const db = getFirestore(); // Use main Firestore to read verification requests

//       // Query: Get all pending seller verifications
//       const verificationRef = collection(db, "verificationRequests");
//       // const verificationRef = collection(mobileDb, "verifications");
//       const q = query(
//         verificationRef,
//         where("userRole", "==", "driver"),
//         where("status", "in", ["pending", "under_review"])
//       );

//       const querySnapshot = await getDocs(q);

//       const sellersData: SellerVerification[] = [];

//       querySnapshot.forEach((docSnap) => {
//         const data = docSnap.data();
//         console.log("Seller verification:", docSnap.id, data);

//         sellersData.push({
//           id: docSnap.id,
//           userId: data.userId || "",
//           userRole: data.userRole || "",
//           sellerType: data.sellerType || "",
//           name: data.name || "Unknown",
//           email: data.email || "",
//           phone: data.phone || "",
//           businessName: data.businessName || "",
//           businessAddress: data.businessAddress || "",
//           status: data.status || "pending",
//           documents: data.documents || {},
//           submittedAt: data.submittedAt?.toDate?.() || new Date(),
//           createdAt: data.createdAt?.toDate?.() || new Date(),
//         });
//       });

//       console.log("✅ Loaded sellers:", sellersData);
//       setSellers(sellersData);
//     } catch (error) {
//       console.error("Error loading sellers:", error);
//       toast.error(
//         "Failed to load sellers: " + (error as unknown as Error).message
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ═══════════════════════════════════════════════════════════
//   // 🔥 APPROVE SELLER
//   // ═══════════════════════════════════════════════════════════
//   const handleApproveSeller = async () => {
//     if (!selectedSeller) return;

//     try {
//       setActionLoading(true);
//       const db = getFirestore(); // Use main Firestore to read/write verification requests
//       const admin = auth.currentUser;

//       if (!admin) {
//         toast.error("Admin not authenticated");
//         return;
//       }

//       console.log("Approving seller:", selectedSeller.userId);

//       // Update verification request status
//       await updateDoc(doc(db, "verificationRequests", selectedSeller.id), {
//         status: "verified",
//         reviewedAt: Timestamp.now(),
//         reviewedBy: admin.email,
//         updatedAt: Timestamp.now(),
//       });

//       // Update user verification status
//       await updateDoc(doc(db, "users", selectedSeller.userId), {
//         verificationStatus: "verified",
//         updatedAt: Timestamp.now(),
//       });

//       // Create notification for seller
//       await addDoc(collection(db, "notifications"), {
//         userId: selectedSeller.userId,
//         type: "verification_approved",
//         title: "🎉 Verification Approved!",
//         message: `Your ${selectedSeller.sellerType.replace(
//           "_",
//           " "
//         )} account has been verified. You can now start operating!`,
//         read: false,
//         createdAt: Timestamp.now(),
//       });

//       console.log("✅ Seller approved successfully");

//       toast.success(`${selectedSeller.businessName} verified successfully!`);
//       setShowApprovalModal(false);
//       setSelectedSeller(null);

//       // Reload sellers list
//       loadSellers();
//     } catch (error) {
//       console.error("Error approving seller:", error);
//       toast.error(
//         "Failed to approve seller: " + (error as unknown as Error).message
//       );
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   // ═══════════════════════════════════════════════════════════
//   // 🔥 REJECT SELLER
//   // ═══════════════════════════════════════════════════════════
//   const handleRejectSeller = async () => {
//     if (!selectedSeller || !rejectionReason.trim()) {
//       toast.error("Please enter rejection reason");
//       return;
//     }

//     try {
//       setActionLoading(true);
//       const db = getFirestore();
//       const admin = auth.currentUser;

//       if (!admin) {
//         toast.error("Admin not authenticated");
//         return;
//       }

//       console.log("Rejecting seller:", selectedSeller.userId);

//       // Update verification request status
//       await updateDoc(doc(db, "verificationRequests", selectedSeller.id), {
//         status: "rejected",
//         rejectionReason: rejectionReason.trim(),
//         reviewedAt: Timestamp.now(),
//         reviewedBy: admin.email,
//         updatedAt: Timestamp.now(),
//       });

//       // Update user verification status
//       await updateDoc(doc(db, "users", selectedSeller.userId), {
//         verificationStatus: "rejected",
//         updatedAt: Timestamp.now(),
//       });

//       // Create notification for seller
//       await addDoc(collection(db, "notifications"), {
//         userId: selectedSeller.userId,
//         type: "verification_rejected",
//         title: "❌ Verification Rejected",
//         message: `Your verification was rejected. Reason: ${rejectionReason}`,
//         read: false,
//         createdAt: Timestamp.now(),
//       });

//       console.log("✅ Seller rejected successfully");

//       toast.success("Seller rejected. Notification sent.");
//       setShowRejectionModal(false);
//       setRejectionReason("");
//       setSelectedSeller(null);

//       // Reload sellers list
//       loadSellers();
//     } catch (error) {
//       console.error("Error rejecting seller:", error);
//       toast.error(
//         "Failed to reject seller: " + (error as unknown as Error).message
//       );
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   // ═══════════════════════════════════════════════════════════
//   // 🔥 FILTER SELLERS
//   // ═══════════════════════════════════════════════════════════
//   const filteredSellers = sellers.filter(
//     (seller) =>
//       seller.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       seller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       seller.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   // ═══════════════════════════════════════════════════════════
//   // 🔥 RENDER LOADING STATE
//   // ═══════════════════════════════════════════════════════════
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin text-4xl mb-4">⏳</div>
//           <p className="text-gray-600">Loading sellers from Firestore...</p>
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
//             Seller Verifications
//           </h1>
//           <p className="text-gray-600">
//             Review and verify pending seller accounts from Locly Mobile App
//           </p>
//         </div>
//         <button
//           onClick={loadSellers}
//           className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg"
//         >
//           🔄 Refresh
//         </button>
//       </div>

//       {/* SEARCH */}
//       <div className="bg-white rounded-lg border border-gray-200 p-4">
//         <input
//           type="text"
//           placeholder="Search by business name, email, or owner name..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
//         />
//       </div>

//       {/* STATS */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <p className="text-gray-600 text-sm">Total Pending</p>
//           <p className="text-2xl font-bold text-orange-500">
//             {sellers.filter((s) => s.status === "pending").length}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <p className="text-gray-600 text-sm">Under Review</p>
//           <p className="text-2xl font-bold text-blue-500">
//             {sellers.filter((s) => s.status === "under_review").length}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <p className="text-gray-600 text-sm">Total Sellers</p>
//           <p className="text-2xl font-bold text-green-500">{sellers.length}</p>
//         </div>
//       </div>

//       {/* SELLERS LIST */}
//       {filteredSellers.length > 0 ? (
//         <div className="space-y-4">
//           {filteredSellers.map((seller) => (
//             <div
//               key={seller.id}
//               className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
//             >
//               <div className="flex items-start justify-between mb-4">
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                     {seller.businessName}
//                   </h3>
//                   <p className="text-sm text-gray-600 mb-1">
//                     Owner: {seller.name}
//                   </p>
//                   <p className="text-sm text-gray-600 mb-1">
//                     Email: {seller.email}
//                   </p>
//                   <p className="text-sm text-gray-600 mb-2">
//                     Phone: {seller.phone}
//                   </p>
//                   <div className="flex gap-2">
//                     <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
//                       {seller.sellerType.replace("_", " ")}
//                     </span>
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs font-semibold ${
//                         seller.status === "pending"
//                           ? "bg-yellow-100 text-yellow-800"
//                           : "bg-blue-100 text-blue-800"
//                       }`}
//                     >
//                       {seller.status === "pending"
//                         ? "⏳ Pending"
//                         : "🔍 Under Review"}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-sm text-gray-600 mb-4">
//                     Submitted:{" "}
//                     {seller.submittedAt.toLocaleDateString("en-US", {
//                       month: "short",
//                       day: "numeric",
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     })}
//                   </p>
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => {
//                         setSelectedSeller(seller);
//                         setShowApprovalModal(true);
//                       }}
//                       className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-sm"
//                     >
//                       ✅ Approve
//                     </button>
//                     <button
//                       onClick={() => {
//                         setSelectedSeller(seller);
//                         setShowRejectionModal(true);
//                       }}
//                       className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm"
//                     >
//                       ❌ Reject
//                     </button>
//                     <button
//                       onClick={() => setSelectedSeller(seller)}
//                       className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-sm"
//                     >
//                       👁️ View
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* DOCUMENTS */}
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <p className="text-sm font-semibold text-gray-900 mb-3">
//                   Documents Uploaded:
//                 </p>
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//                   {Object.entries(seller.documents || {}).map(([docName]) => (
//                     <a
//                       key={docName}
//                       href="#"
//                       className="px-3 py-2 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center gap-2 hover:bg-green-200"
//                     >
//                       <span>✅</span>
//                       {docName.replace(/_/g, " ")}
//                     </a>
//                   ))}
//                 </div>
//               </div>

//               {/* BUSINESS ADDRESS */}
//               {seller.businessAddress && (
//                 <div className="mt-3 pt-3 border-t border-gray-200">
//                   <p className="text-sm text-gray-600">
//                     <strong>Address:</strong> {seller.businessAddress}
//                   </p>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       ) : (
//         <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
//           <p className="text-2xl mb-2">📭</p>
//           <p className="text-gray-600 font-medium">No pending sellers</p>
//           {sellers.length > 0 && (
//             <p className="text-gray-500 text-sm mt-1">
//               All sellers have been reviewed!
//             </p>
//           )}
//         </div>
//       )}

//       {/* APPROVAL MODAL */}
//       {showApprovalModal && selectedSeller && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
//             <h2 className="text-xl font-bold text-gray-900 mb-4">
//               Confirm Approval
//             </h2>
//             <p className="text-gray-600 mb-4">
//               Are you sure you want to approve{" "}
//               <strong>{selectedSeller.businessName}</strong>? They will
//               immediately be able to start operating on Locly.
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
//                 onClick={handleApproveSeller}
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
//       {showRejectionModal && selectedSeller && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
//             <h2 className="text-xl font-bold text-gray-900 mb-4">
//               Reject Seller
//             </h2>
//             <p className="text-gray-600 mb-4">
//               Why are you rejecting {selectedSeller.businessName}?
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
//                 onClick={handleRejectSeller}
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
