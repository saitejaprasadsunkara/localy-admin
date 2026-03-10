// app/dashboard/sellers/page_UPDATED.tsx
/**
 * 🔥 SELLERS VERIFICATION PAGE - UPDATED WITH FIRESTORE INTEGRATION
 * Admin Portal: webapp-1071a
 *
 * Shows pending seller verifications from locly-92848 (Mobile App)
 * Admins can approve/reject sellers
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
} from "firebase/firestore";
import { getMobileAppFirestore } from "../../../lib/firebaseMultiProject";
import { auth } from "../../../lib/firebase";

interface SellerVerification {
  id: string;
  userId: string;
  userRole: string;
  sellerType: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessAddress: string;
  status: "pending" | "under_review" | "verified" | "rejected";
  documents: Record<string, string>;
  submittedAt: Date;
  createdAt: Date;
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<SellerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeller, setSelectedSeller] =
    useState<SellerVerification | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // 🔥 LOAD SELLERS FROM MOBILE APP FIRESTORE
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      setLoading(true);
      console.log("Loading sellers from locly-92848 Firestore...");

      // Get Firestore instance from mobile app project
      const mobileDb = getMobileAppFirestore();

      // Query: Get all pending seller verifications
      const verificationRef = collection(mobileDb, "verificationRequests");
      // const verificationRef = collection(mobileDb, "verifications");
      const q = query(
        verificationRef,
        where("userRole", "==", "driver"),
        where("status", "in", ["pending", "under_review"])
      );

      const querySnapshot = await getDocs(q);

      const sellersData: SellerVerification[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        console.log("Seller verification:", docSnap.id, data);

        sellersData.push({
          id: docSnap.id,
          userId: data.userId || "",
          userRole: data.userRole || "",
          sellerType: data.sellerType || "",
          name: data.name || "Unknown",
          email: data.email || "",
          phone: data.phone || "",
          businessName: data.businessName || "",
          businessAddress: data.businessAddress || "",
          status: data.status || "pending",
          documents: data.documents || {},
          submittedAt: data.submittedAt?.toDate?.() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });
      });

      console.log("✅ Loaded sellers:", sellersData);
      setSellers(sellersData);
    } catch (error) {
      console.error("Error loading sellers:", error);
      toast.error(
        "Failed to load sellers: " + (error as unknown as Error).message
      );
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 APPROVE SELLER
  // ═══════════════════════════════════════════════════════════
  const handleApproveSeller = async () => {
    if (!selectedSeller) return;

    try {
      setActionLoading(true);
      const mobileDb = getMobileAppFirestore();
      const admin = auth.currentUser;

      if (!admin) {
        toast.error("Admin not authenticated");
        return;
      }

      console.log("Approving seller:", selectedSeller.userId);

      // Update verification request status
      await updateDoc(
        doc(mobileDb, "verificationRequests", selectedSeller.id),
        {
          status: "verified",
          reviewedAt: Timestamp.now(),
          reviewedBy: admin.email,
          updatedAt: Timestamp.now(),
        }
      );

      // Update user verification status
      await updateDoc(doc(mobileDb, "users", selectedSeller.userId), {
        verificationStatus: "verified",
        updatedAt: Timestamp.now(),
      });

      // Create notification for seller
      await addDoc(collection(mobileDb, "notifications"), {
        userId: selectedSeller.userId,
        type: "verification_approved",
        title: "🎉 Verification Approved!",
        message: `Your ${selectedSeller.sellerType.replace(
          "_",
          " "
        )} account has been verified. You can now start operating!`,
        read: false,
        createdAt: Timestamp.now(),
      });

      console.log("✅ Seller approved successfully");

      toast.success(`${selectedSeller.businessName} verified successfully!`);
      setShowApprovalModal(false);
      setSelectedSeller(null);

      // Reload sellers list
      loadSellers();
    } catch (error) {
      console.error("Error approving seller:", error);
      toast.error(
        "Failed to approve seller: " + (error as unknown as Error).message
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 REJECT SELLER
  // ═══════════════════════════════════════════════════════════
  const handleRejectSeller = async () => {
    if (!selectedSeller || !rejectionReason.trim()) {
      toast.error("Please enter rejection reason");
      return;
    }

    try {
      setActionLoading(true);
      const mobileDb = getMobileAppFirestore();
      const admin = auth.currentUser;

      if (!admin) {
        toast.error("Admin not authenticated");
        return;
      }

      console.log("Rejecting seller:", selectedSeller.userId);

      // Update verification request status
      await updateDoc(
        doc(mobileDb, "verificationRequests", selectedSeller.id),
        {
          status: "rejected",
          rejectionReason: rejectionReason.trim(),
          reviewedAt: Timestamp.now(),
          reviewedBy: admin.email,
          updatedAt: Timestamp.now(),
        }
      );

      // Update user verification status
      await updateDoc(doc(mobileDb, "users", selectedSeller.userId), {
        verificationStatus: "rejected",
        updatedAt: Timestamp.now(),
      });

      // Create notification for seller
      await addDoc(collection(mobileDb, "notifications"), {
        userId: selectedSeller.userId,
        type: "verification_rejected",
        title: "❌ Verification Rejected",
        message: `Your verification was rejected. Reason: ${rejectionReason}`,
        read: false,
        createdAt: Timestamp.now(),
      });

      console.log("✅ Seller rejected successfully");

      toast.success("Seller rejected. Notification sent.");
      setShowRejectionModal(false);
      setRejectionReason("");
      setSelectedSeller(null);

      // Reload sellers list
      loadSellers();
    } catch (error) {
      console.error("Error rejecting seller:", error);
      toast.error(
        "Failed to reject seller: " + (error as unknown as Error).message
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 FILTER SELLERS
  // ═══════════════════════════════════════════════════════════
  const filteredSellers = sellers.filter(
    (seller) =>
      seller.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ═══════════════════════════════════════════════════════════
  // 🔥 RENDER LOADING STATE
  // ═══════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading sellers from Firestore...</p>
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
            Seller Verifications
          </h1>
          <p className="text-gray-600">
            Review and verify pending seller accounts from Locly Mobile App
          </p>
        </div>
        <button
          onClick={loadSellers}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg"
        >
          🔄 Refresh
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <input
          type="text"
          placeholder="Search by business name, email, or owner name..."
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
            {sellers.filter((s) => s.status === "pending").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Under Review</p>
          <p className="text-2xl font-bold text-blue-500">
            {sellers.filter((s) => s.status === "under_review").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Sellers</p>
          <p className="text-2xl font-bold text-green-500">{sellers.length}</p>
        </div>
      </div>

      {/* SELLERS LIST */}
      {filteredSellers.length > 0 ? (
        <div className="space-y-4">
          {filteredSellers.map((seller) => (
            <div
              key={seller.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {seller.businessName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Owner: {seller.name}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    Email: {seller.email}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Phone: {seller.phone}
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {seller.sellerType.replace("_", " ")}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        seller.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {seller.status === "pending"
                        ? "⏳ Pending"
                        : "🔍 Under Review"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-4">
                    Submitted:{" "}
                    {seller.submittedAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedSeller(seller);
                        setShowApprovalModal(true);
                      }}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-sm"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSeller(seller);
                        setShowRejectionModal(true);
                      }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm"
                    >
                      ❌ Reject
                    </button>
                    <button
                      onClick={() => setSelectedSeller(seller)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-sm"
                    >
                      👁️ View
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
                  {Object.entries(seller.documents || {}).map(([docName]) => (
                    <a
                      key={docName}
                      href="#"
                      className="px-3 py-2 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center gap-2 hover:bg-green-200"
                    >
                      <span>✅</span>
                      {docName.replace(/_/g, " ")}
                    </a>
                  ))}
                </div>
              </div>

              {/* BUSINESS ADDRESS */}
              {seller.businessAddress && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Address:</strong> {seller.businessAddress}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-gray-600 font-medium">No pending sellers</p>
          {sellers.length > 0 && (
            <p className="text-gray-500 text-sm mt-1">
              All sellers have been reviewed!
            </p>
          )}
        </div>
      )}

      {/* APPROVAL MODAL */}
      {showApprovalModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Approval
            </h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to approve{" "}
              <strong>{selectedSeller.businessName}</strong>? They will
              immediately be able to start operating on Locly.
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
                onClick={handleApproveSeller}
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
      {showRejectionModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Reject Seller
            </h2>
            <p className="text-gray-600 mb-4">
              Why are you rejecting {selectedSeller.businessName}?
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
                onClick={handleRejectSeller}
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

// // app/dashboard/drivers/page.tsx
// "use client";

// import React, { useState, useEffect } from "react";
// import DriversList from "../../../components/verification/DriversList";
// import toast from "react-hot-toast";

// // Define Driver interface
// interface Driver {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   vehicleType: string;
//   vehicleNumber: string;
//   status: "pending" | "under_review" | "verified" | "rejected";
//   documents: Record<string, string>;
//   submittedAt: Date;
//   reviewedAt?: Date;
//   reviewedBy?: string;
//   rejectionReason?: string;
// }

// export default function DriversPage() {
//   // STATE MANAGEMENT
//   const [drivers, setDrivers] = useState<Driver[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState<string>("all");
//   const [searchQuery, setSearchQuery] = useState<string>("");

//   // LOAD DRIVERS ON MOUNT
//   useEffect(() => {
//     loadDrivers();
//   }, []);

//   // LOAD MOCK DRIVERS DATA
//   const loadDrivers = async () => {
//     try {
//       setLoading(true);

//       // TODO: Replace with real Firestore query
//       // const driversRef = collection(db, 'driverVerifications');
//       // const q = query(driversRef);
//       // const querySnapshot = await getDocs(q);
//       // const data = querySnapshot.docs.map(doc => doc.data());

//       // FOR NOW: Mock data
//       const mockDrivers: Driver[] = [
//         {
//           id: "1",
//           name: "Vikram Patel",
//           email: "vikram@driver.com",
//           phone: "+91 9876543220",
//           vehicleType: "Car",
//           vehicleNumber: "MH01AB1234",
//           status: "pending",
//           documents: {
//             license: "https://via.placeholder.com/400x300?text=License",
//             rc: "https://via.placeholder.com/400x300?text=RC",
//             insurance: "https://via.placeholder.com/400x300?text=Insurance",
//             aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
//           },
//           submittedAt: new Date("2024-03-05"),
//         },
//         {
//           id: "2",
//           name: "Amit Kumar",
//           email: "amit@driver.com",
//           phone: "+91 9876543221",
//           vehicleType: "Bike",
//           vehicleNumber: "MH01CD5678",
//           status: "pending",
//           documents: {
//             license: "https://via.placeholder.com/400x300?text=License",
//             rc: "https://via.placeholder.com/400x300?text=RC",
//             insurance: "https://via.placeholder.com/400x300?text=Insurance",
//             aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
//           },
//           submittedAt: new Date("2024-03-04"),
//         },
//         {
//           id: "3",
//           name: "Suresh Reddy",
//           email: "suresh@driver.com",
//           phone: "+91 9876543222",
//           vehicleType: "Auto",
//           vehicleNumber: "TS01EF9012",
//           status: "under_review",
//           documents: {
//             license: "https://via.placeholder.com/400x300?text=License",
//             rc: "https://via.placeholder.com/400x300?text=RC",
//             insurance: "https://via.placeholder.com/400x300?text=Insurance",
//             aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
//           },
//           submittedAt: new Date("2024-03-03"),
//           reviewedBy: "admin@locly.app",
//         },
//         {
//           id: "4",
//           name: "Rohan Singh",
//           email: "rohan@driver.com",
//           phone: "+91 9876543223",
//           vehicleType: "Car",
//           vehicleNumber: "DL01GH3456",
//           status: "verified",
//           documents: {
//             license: "https://via.placeholder.com/400x300?text=License",
//             rc: "https://via.placeholder.com/400x300?text=RC",
//             insurance: "https://via.placeholder.com/400x300?text=Insurance",
//             aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
//           },
//           submittedAt: new Date("2024-03-02"),
//           reviewedAt: new Date("2024-03-03"),
//           reviewedBy: "admin@locly.app",
//         },
//         {
//           id: "5",
//           name: "Deepak Verma",
//           email: "deepak@driver.com",
//           phone: "+91 9876543224",
//           vehicleType: "Bike",
//           vehicleNumber: "KA01IJ7890",
//           status: "rejected",
//           documents: {
//             license: "https://via.placeholder.com/400x300?text=License",
//             rc: "https://via.placeholder.com/400x300?text=RC",
//             insurance: "https://via.placeholder.com/400x300?text=Insurance",
//             aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
//           },
//           submittedAt: new Date("2024-03-01"),
//           reviewedAt: new Date("2024-03-02"),
//           reviewedBy: "admin@locly.app",
//           rejectionReason: "Driving license expired - valid until 2023",
//         },
//       ];

//       setDrivers(mockDrivers);
//     } catch (error) {
//       console.error("Error loading drivers:", error);
//       toast.error("Failed to load drivers");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // FILTER DRIVERS BASED ON FILTER & SEARCH
//   const filteredDrivers = drivers.filter((driver) => {
//     const matchesFilter = filter === "all" || driver.status === filter;
//     const matchesSearch =
//       driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       driver.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesFilter && matchesSearch;
//   });

//   // HANDLE APPROVE
//   const handleApprove = async (driverId: string) => {
//     try {
//       console.log("Approving driver:", driverId);

//       // TODO: Update in Firestore
//       // const driverRef = doc(db, 'driverVerifications', driverId);
//       // await updateDoc(driverRef, {
//       //   status: 'verified',
//       //   reviewedAt: serverTimestamp(),
//       //   reviewedBy: currentUserEmail,
//       // });

//       // UPDATE LOCAL STATE
//       setDrivers(
//         drivers.map((d) =>
//           d.id === driverId
//             ? {
//                 ...d,
//                 status: "verified",
//                 reviewedAt: new Date(),
//                 reviewedBy: "admin@locly.app",
//               }
//             : d
//         )
//       );

//       toast.success("Driver approved successfully! ✅");
//     } catch (error) {
//       console.error("Error approving driver:", error);
//       toast.error("Failed to approve driver");
//     }
//   };

//   // HANDLE REJECT
//   const handleReject = async (driverId: string, reason: string) => {
//     try {
//       console.log("Rejecting driver:", driverId, "Reason:", reason);

//       // TODO: Update in Firestore
//       // const driverRef = doc(db, 'driverVerifications', driverId);
//       // await updateDoc(driverRef, {
//       //   status: 'rejected',
//       //   rejectionReason: reason,
//       //   reviewedAt: serverTimestamp(),
//       //   reviewedBy: currentUserEmail,
//       // });

//       // UPDATE LOCAL STATE
//       setDrivers(
//         drivers.map((d) =>
//           d.id === driverId
//             ? {
//                 ...d,
//                 status: "rejected",
//                 rejectionReason: reason,
//                 reviewedAt: new Date(),
//                 reviewedBy: "admin@locly.app",
//               }
//             : d
//         )
//       );

//       toast.success("Driver rejected successfully! ❌");
//     } catch (error) {
//       console.error("Error rejecting driver:", error);
//       toast.error("Failed to reject driver");
//     }
//   };

//   // LOADING STATE
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin text-4xl mb-4">⏳</div>
//           <p className="text-gray-600">Loading drivers...</p>
//         </div>
//       </div>
//     );
//   }

//   // RENDER PAGE
//   return (
//     <div className="space-y-6">
//       {/* HEADER */}
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900 mb-2">
//           Drivers Verification
//         </h1>
//         <p className="text-gray-600">
//           Review and approve/reject driver applications
//         </p>
//       </div>

//       {/* SEARCH & FILTER SECTION */}
//       <div className="bg-white rounded-lg border border-gray-200 p-6">
//         <div className="flex flex-col md:flex-row gap-4">
//           {/* SEARCH INPUT */}
//           <div className="flex-1">
//             <input
//               type="text"
//               placeholder="Search by name, email, or vehicle number..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
//             />
//           </div>

//           {/* FILTER BUTTONS */}
//           <div className="flex gap-2 flex-wrap">
//             {[
//               { label: "All", value: "all" },
//               { label: "Pending", value: "pending" },
//               { label: "Under Review", value: "under_review" },
//               { label: "Verified", value: "verified" },
//               { label: "Rejected", value: "rejected" },
//             ].map((option) => (
//               <button
//                 key={option.value}
//                 onClick={() => setFilter(option.value)}
//                 className={`px-4 py-2 rounded-lg font-medium transition-colors ${
//                   filter === option.value
//                     ? "bg-orange-500 text-white"
//                     : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                 }`}
//               >
//                 {option.label}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* STATS CARDS */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <p className="text-gray-600 text-sm">Total Pending</p>
//           <p className="text-2xl font-bold text-orange-500">
//             {drivers.filter((d) => d.status === "pending").length}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <p className="text-gray-600 text-sm">Under Review</p>
//           <p className="text-2xl font-bold text-blue-500">
//             {drivers.filter((d) => d.status === "under_review").length}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <p className="text-gray-600 text-sm">Verified</p>
//           <p className="text-2xl font-bold text-green-500">
//             {drivers.filter((d) => d.status === "verified").length}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <p className="text-gray-600 text-sm">Rejected</p>
//           <p className="text-2xl font-bold text-red-500">
//             {drivers.filter((d) => d.status === "rejected").length}
//           </p>
//         </div>
//       </div>

//       {/* DRIVERS LIST - USING COMPONENT */}
//       {filteredDrivers.length > 0 ? (
//         <DriversList
//           drivers={filteredDrivers}
//           onApprove={handleApprove}
//           onReject={handleReject}
//         />
//       ) : (
//         <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
//           <p className="text-2xl mb-2">📭</p>
//           <p className="text-gray-600 font-medium">No drivers found</p>
//           <p className="text-gray-500 text-sm mt-1">
//             Try adjusting your filters or search query
//           </p>
//         </div>
//       )}

//       {/* INFO BOX */}
//       <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
//         <p className="text-blue-900 font-semibold mb-2">💡 Pro Tip</p>
//         <p className="text-blue-800 text-sm">
//           Verify driver documents carefully - check license validity, RC
//           registration, insurance coverage, and Aadhar authenticity. All
//           approvals and rejections are logged for compliance.
//         </p>
//       </div>
//     </div>
//   );
// }

// // // app/dashboard/drivers/page.tsx
// // "use client";

// // import React, { useState, useEffect } from "react";
// // import DriversList from "../../../components/verification/DriversList";
// // import toast from "react-hot-toast";

// // interface Driver {
// //   id: string;
// //   name: string;
// //   email: string;
// //   phone: string;
// //   vehicleType: string;
// //   vehicleNumber: string;
// //   status: "pending" | "under_review" | "verified" | "rejected";
// //   documents: Record<string, string>;
// //   submittedAt: Date;
// //   reviewedAt?: Date;
// //   reviewedBy?: string;
// //   rejectionReason?: string;
// // }

// // export default function DriversPage() {
// //   const [drivers, setDrivers] = useState<Driver[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [filter, setFilter] = useState<string>("all");
// //   const [searchQuery, setSearchQuery] = useState<string>("");

// //   useEffect(() => {
// //     loadDrivers();
// //   }, []);

// //   const loadDrivers = async () => {
// //     try {
// //       // TODO: Replace with real Firestore query
// //       const mockDrivers: Driver[] = [
// //         {
// //           id: "1",
// //           name: "Vikram Patel",
// //           email: "vikram@driver.com",
// //           phone: "+91 9876543220",
// //           vehicleType: "Car",
// //           vehicleNumber: "MH01AB1234",
// //           status: "pending",
// //           documents: {
// //             license: "https://via.placeholder.com/400x300?text=License",
// //             rc: "https://via.placeholder.com/400x300?text=RC",
// //             insurance: "https://via.placeholder.com/400x300?text=Insurance",
// //             aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
// //           },
// //           submittedAt: new Date("2024-03-05"),
// //         },
// //         {
// //           id: "2",
// //           name: "Amit Kumar",
// //           email: "amit@driver.com",
// //           phone: "+91 9876543221",
// //           vehicleType: "Bike",
// //           vehicleNumber: "MH01CD5678",
// //           status: "pending",
// //           documents: {
// //             license: "https://via.placeholder.com/400x300?text=License",
// //             rc: "https://via.placeholder.com/400x300?text=RC",
// //             insurance: "https://via.placeholder.com/400x300?text=Insurance",
// //             aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
// //           },
// //           submittedAt: new Date("2024-03-04"),
// //         },
// //         {
// //           id: "3",
// //           name: "Suresh Reddy",
// //           email: "suresh@driver.com",
// //           phone: "+91 9876543222",
// //           vehicleType: "Auto",
// //           vehicleNumber: "TS01EF9012",
// //           status: "under_review",
// //           documents: {
// //             license: "https://via.placeholder.com/400x300?text=License",
// //             rc: "https://via.placeholder.com/400x300?text=RC",
// //             insurance: "https://via.placeholder.com/400x300?text=Insurance",
// //             aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
// //           },
// //           submittedAt: new Date("2024-03-03"),
// //           reviewedBy: "admin@locly.app",
// //         },
// //       ];

// //       setDrivers(mockDrivers);
// //     } catch (error) {
// //       console.error("Error loading drivers:", error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const filteredDrivers = drivers.filter((driver) => {
// //     const matchesFilter = filter === "all" || driver.status === filter;
// //     const matchesSearch =
// //       driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //       driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //       driver.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
// //     return matchesFilter && matchesSearch;
// //   });

// //   const handleApprove = async (driverId: string) => {
// //     try {
// //       console.log("Approving driver:", driverId);
// //       // TODO: Update in Firestore
// //       // TODO: Update in Firestore
// //       // const sellerRef = doc(db, 'sellerVerifications', sellerId);
// //       // await updateDoc(sellerRef, {
// //       //   status: 'verified',
// //       //   reviewedAt: serverTimestamp(),
// //       //   reviewedBy: currentUserEmail,
// //       // });

// //       //update local state
// //       setDrivers(
// //         drivers.map((d) =>
// //           d.id === driverId
// //             ? {
// //                 ...d,
// //                 status: "verified",
// //                 reviewedAt: new Date(),
// //                 reviewedBy: "admin@locly.app",
// //               }
// //             : d
// //         )
// //       );

// //       toast.success("Driver approved successfully! ✅");
// //     } catch (error) {
// //       console.error("Error approving driver:", error);
// //       toast.error("Failed to approve driver");
// //     }
// //   };

// //   const handleReject = async (driverId: string, reason: string) => {
// //     try {
// //       console.log("Rejecting driver:", driverId, "Reason:", reason);
// //       // TODO: Update in Firestore
// //       // const sellerRef = doc(db, 'sellerVerifications', sellerId);
// //       // await updateDoc(sellerRef, {
// //       //   status: 'rejected',
// //       //   rejectionReason: reason,
// //       //   reviewedAt: serverTimestamp(),
// //       //   reviewedBy: currentUserEmail,
// //       // });

// //       //update local state
// //       setDrivers(
// //         drivers.map((d) =>
// //           d.id === driverId
// //             ? {
// //                 ...d,
// //                 status: "rejected",
// //                 rejectionReason: reason,
// //                 reviewedAt: new Date(),
// //                 reviewedBy: "admin@locly.app",
// //               }
// //             : d
// //         )
// //       );

// //       toast.success("Driver rejected successfully! ❌");
// //     } catch (error) {
// //       console.error("Error rejecting driver:", error);
// //       toast.error("Failed to reject driver");
// //     }
// //   };

// //   //loading state
// //   if (loading) {
// //     return (
// //       <div className="flex items-center justify-center min-h-screen">
// //         <div className="text-center">
// //           <div className="animate-spin text-4xl mb-4">⏳</div>
// //           <p className="text-gray-600">Loading drivers...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="space-y-6">
// //       {/* Header */}
// //       <div>
// //         <h1 className="text-3xl font-bold text-gray-900 mb-2">
// //           Drivers Verification
// //         </h1>
// //         <p className="text-gray-600">
// //           Review and approve/reject driver applications
// //         </p>
// //       </div>

// //       {/* Filters */}
// //       <div className="bg-white rounded-lg border border-gray-200 p-6">
// //         <div className="flex flex-col md:flex-row gap-4">
// //           {/* Search */}
// //           <div className="flex-1">
// //             <input
// //               type="text"
// //               placeholder="Search by name, email, or vehicle number..."
// //               value={searchQuery}
// //               onChange={(e) => setSearchQuery(e.target.value)}
// //               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
// //             />
// //           </div>

// //           {/* Filter */}
// //           <div className="flex gap-2">
// //             {[
// //               { label: "All", value: "all" },
// //               { label: "Pending", value: "pending" },
// //               { label: "Under Review", value: "under_review" },
// //               { label: "Verified", value: "verified" },
// //               { label: "Rejected", value: "rejected" },
// //             ].map((option) => (
// //               <button
// //                 key={option.value}
// //                 onClick={() => setFilter(option.value)}
// //                 className={`px-4 py-2 rounded-lg font-medium transition-colors ${
// //                   filter === option.value
// //                     ? "bg-orange-500 text-white"
// //                     : "bg-gray-100 text-gray-700 hover:bg-gray-200"
// //                 }`}
// //               >
// //                 {option.label}
// //               </button>
// //             ))}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Stats */}
// //       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
// //         <div className="bg-white rounded-lg border border-gray-200 p-4">
// //           <p className="text-gray-600 text-sm">Total Pending</p>
// //           <p className="text-2xl font-bold text-orange-500">
// //             {drivers.filter((d) => d.status === "pending").length}
// //           </p>
// //         </div>
// //         <div className="bg-white rounded-lg border border-gray-200 p-4">
// //           <p className="text-gray-600 text-sm">Under Review</p>
// //           <p className="text-2xl font-bold text-blue-500">
// //             {drivers.filter((d) => d.status === "under_review").length}
// //           </p>
// //         </div>
// //         <div className="bg-white rounded-lg border border-gray-200 p-4">
// //           <p className="text-gray-600 text-sm">Verified</p>
// //           <p className="text-2xl font-bold text-green-500">
// //             {drivers.filter((d) => d.status === "verified").length}
// //           </p>
// //         </div>
// //         <div className="bg-white rounded-lg border border-gray-200 p-4">
// //           <p className="text-gray-600 text-sm">Rejected</p>
// //           <p className="text-2xl font-bold text-red-500">
// //             {drivers.filter((d) => d.status === "rejected").length}
// //           </p>
// //         </div>
// //       </div>

// //       {/* Drivers List */}
// //       {filteredDrivers.length > 0 ? (
// //         <DriversList
// //           drivers={filteredDrivers}
// //           onApprove={handleApprove}
// //           onReject={handleReject}
// //         />
// //       ) : (
// //         <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
// //           <p className="text-2xl mb-2">📭</p>
// //           <p className="text-gray-600 font-medium">No drivers found</p>
// //           <p className="text-gray-500 text-sm mt-1">
// //             Try adjusting your filters or search query
// //           </p>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // ========================================
// // DRIVERS LIST COMPONENT
// // ========================================
// // interface DriversListProps {
// //   drivers: Driver[];
// //   onApprove: (driverId: string) => Promise<void>;
// //   onReject: (driverId: string, reason: string) => Promise<void>;
// // }

// // function DriversList({ drivers, onApprove, onReject }: DriversListProps) {
// //   const [expandedId, setExpandedId] = useState<string | null>(null);
// //   const [showApprovalModal, setShowApprovalModal] = useState<string | null>(
// //     null
// //   );
// //   const [showRejectionModal, setShowRejectionModal] = useState<string | null>(
// //     null
// //   );

// //   const getStatusColor = (status: string) => {
// //     switch (status) {
// //       case "pending":
// //         return "bg-yellow-100 text-yellow-800";
// //       case "under_review":
// //         return "bg-blue-100 text-blue-800";
// //       case "verified":
// //         return "bg-green-100 text-green-800";
// //       case "rejected":
// //         return "bg-red-100 text-red-800";
// //       default:
// //         return "bg-gray-100 text-gray-800";
// //     }
// //   };

// //   const getStatusLabel = (status: string) => {
// //     return status
// //       .split("_")
// //       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
// //       .join(" ");
// //   };

// //   return (
// //     <div className="space-y-4">
// //       {drivers.map((driver) => (
// //         <div
// //           key={driver.id}
// //           className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
// //         >
// //           {/* Driver Card */}
// //           <div
// //             onClick={() =>
// //               setExpandedId(expandedId === driver.id ? null : driver.id)
// //             }
// //             className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
// //           >
// //             <div className="flex items-start justify-between">
// //               <div className="flex-1">
// //                 <div className="flex items-center gap-3 mb-2">
// //                   <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
// //                     🚗
// //                   </div>
// //                   <div>
// //                     <h3 className="font-semibold text-gray-900">
// //                       {driver.name}
// //                     </h3>
// //                     <p className="text-sm text-gray-600">
// //                       {driver.vehicleNumber}
// //                     </p>
// //                   </div>
// //                 </div>
// //                 <div className="flex gap-3 mt-2">
// //                   <span
// //                     className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
// //                       driver.status
// //                     )}`}
// //                   >
// //                     {getStatusLabel(driver.status)}
// //                   </span>
// //                   <span className="text-xs text-gray-500">
// //                     📅 {driver.submittedAt.toLocaleDateString()}
// //                   </span>
// //                   <span className="text-xs text-gray-500">
// //                     🚗 {driver.vehicleType}
// //                   </span>
// //                 </div>
// //               </div>
// //               <div className="text-right">
// //                 <p className="text-sm text-gray-600">{driver.email}</p>
// //                 <p className="text-sm text-gray-600">{driver.phone}</p>
// //                 <p className="text-xs text-gray-500 mt-1">
// //                   {expandedId === driver.id ? "▲" : "▼"}
// //                 </p>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Expanded Details */}
// //           {expandedId === driver.id && (
// //             <div className="border-t border-gray-200 bg-gray-50 p-6">
// //               <div className="grid grid-cols-2 gap-6 mb-6">
// //                 <div>
// //                   <p className="text-sm text-gray-600 mb-1">Full Name</p>
// //                   <p className="font-medium text-gray-900">{driver.name}</p>
// //                 </div>
// //                 <div>
// //                   <p className="text-sm text-gray-600 mb-1">Email</p>
// //                   <p className="font-medium text-gray-900">{driver.email}</p>
// //                 </div>
// //                 <div>
// //                   <p className="text-sm text-gray-600 mb-1">Phone</p>
// //                   <p className="font-medium text-gray-900">{driver.phone}</p>
// //                 </div>
// //                 <div>
// //                   <p className="text-sm text-gray-600 mb-1">Submitted On</p>
// //                   <p className="font-medium text-gray-900">
// //                     {driver.submittedAt.toLocaleDateString()}
// //                   </p>
// //                 </div>
// //                 <div>
// //                   <p className="text-sm text-gray-600 mb-1">Vehicle Type</p>
// //                   <p className="font-medium text-gray-900">
// //                     {driver.vehicleType}
// //                   </p>
// //                 </div>
// //                 <div>
// //                   <p className="text-sm text-gray-600 mb-1">Vehicle Number</p>
// //                   <p className="font-medium text-gray-900">
// //                     {driver.vehicleNumber}
// //                   </p>
// //                 </div>
// //               </div>

// //               {/* Documents */}
// //               <div className="mb-6">
// //                 <p className="text-sm font-semibold text-gray-900 mb-3">
// //                   Documents
// //                 </p>
// //                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
// //                   {Object.entries(driver.documents).map(([docName, docUrl]) => (
// //                     <a
// //                       key={docName}
// //                       href={docUrl}
// //                       target="_blank"
// //                       rel="noopener noreferrer"
// //                       className="group relative"
// //                     >
// //                       <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 hover:opacity-80 transition-opacity">
// //                         <img
// //                           src={docUrl}
// //                           alt={docName}
// //                           className="w-full h-full object-cover"
// //                         />
// //                       </div>
// //                       <p className="text-xs text-gray-600 mt-1 capitalize truncate">
// //                         {docName}
// //                       </p>
// //                     </a>
// //                   ))}
// //                 </div>
// //               </div>

// //               {/* Actions */}
// //               {driver.status === "pending" ||
// //               driver.status === "under_review" ? (
// //                 <div className="flex gap-3">
// //                   <button
// //                     onClick={() => setShowApprovalModal(driver.id)}
// //                     className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
// //                   >
// //                     ✅ Approve
// //                   </button>
// //                   <button
// //                     onClick={() => setShowRejectionModal(driver.id)}
// //                     className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
// //                   >
// //                     ❌ Reject
// //                   </button>
// //                   <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
// //                     💬 Mark Under Review
// //                   </button>
// //                 </div>
// //               ) : (
// //                 <div className="text-center p-4 bg-gray-200 rounded-lg">
// //                   <p className="text-gray-700 font-medium">
// //                     {driver.status === "verified"
// //                       ? "✅ Already Verified"
// //                       : "❌ Rejected"}
// //                   </p>
// //                   {driver.rejectionReason && (
// //                     <p className="text-sm text-gray-600 mt-1">
// //                       Reason: {driver.rejectionReason}
// //                     </p>
// //                   )}
// //                 </div>
// //               )}
// //             </div>
// //           )}

// //           {/* Approval Modal */}
// //           {showApprovalModal === driver.id && (
// //             <ApprovalModal
// //               driverName={driver.name}
// //               onConfirm={() => {
// //                 onApprove(driver.id);
// //                 setShowApprovalModal(null);
// //               }}
// //               onCancel={() => setShowApprovalModal(null)}
// //             />
// //           )}

// //           {/* Rejection Modal */}
// //           {showRejectionModal === driver.id && (
// //             <RejectionModal
// //               driverName={driver.name}
// //               onConfirm={(reason) => {
// //                 onReject(driver.id, reason);
// //                 setShowRejectionModal(null);
// //               }}
// //               onCancel={() => setShowRejectionModal(null)}
// //             />
// //           )}
// //         </div>
// //       ))}
// //     </div>
// //   );
// // }

// // // ========================================
// // // APPROVAL MODAL COMPONENT
// // // ========================================

// // interface ApprovalModalProps {
// //   driverName: string;
// //   onConfirm: () => void;
// //   onCancel: () => void;
// // }

// // function ApprovalModal({
// //   driverName,
// //   onConfirm,
// //   onCancel,
// // }: ApprovalModalProps) {
// //   const [notes, setNotes] = useState("");

// //   return (
// //     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
// //       <div className="bg-white rounded-lg max-w-md w-full p-6">
// //         <h2 className="text-xl font-bold text-gray-900 mb-4">Approve Driver</h2>
// //         <p className="text-gray-600 mb-4">
// //           Are you sure you want to approve{" "}
// //           <span className="font-semibold">{driverName}</span>?
// //         </p>

// //         <div className="mb-4">
// //           <label className="block text-sm font-medium text-gray-700 mb-2">
// //             Add notes (optional)
// //           </label>
// //           <textarea
// //             value={notes}
// //             onChange={(e) => setNotes(e.target.value)}
// //             placeholder="Additional notes about this driver..."
// //             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
// //             rows={3}
// //           />
// //         </div>

// //         <div className="flex gap-3">
// //           <button
// //             onClick={onCancel}
// //             className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
// //           >
// //             Cancel
// //           </button>
// //           <button
// //             onClick={onConfirm}
// //             className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
// //           >
// //             ✅ Approve
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // ========================================
// // // REJECTION MODAL COMPONENT
// // // ========================================

// // interface RejectionModalProps {
// //   driverName: string;
// //   onConfirm: (reason: string) => void;
// //   onCancel: () => void;
// // }

// // function RejectionModal({
// //   driverName,
// //   onConfirm,
// //   onCancel,
// // }: RejectionModalProps) {
// //   const [reason, setReason] = useState("");

// //   return (
// //     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
// //       <div className="bg-white rounded-lg max-w-md w-full p-6">
// //         <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Driver</h2>
// //         <p className="text-gray-600 mb-4">
// //           Rejecting <span className="font-semibold">{driverName}</span>. Please
// //           provide a reason.
// //         </p>

// //         <div className="mb-4">
// //           <label className="block text-sm font-medium text-gray-700 mb-2">
// //             Rejection Reason *
// //           </label>
// //           <textarea
// //             value={reason}
// //             onChange={(e) => setReason(e.target.value)}
// //             placeholder="Why are you rejecting this driver?"
// //             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
// //             rows={3}
// //           />
// //         </div>

// //         <div className="flex gap-3">
// //           <button
// //             onClick={onCancel}
// //             className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
// //           >
// //             Cancel
// //           </button>
// //           <button
// //             onClick={() => onConfirm(reason)}
// //             disabled={!reason.trim()}
// //             className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
// //           >
// //             ❌ Reject
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
