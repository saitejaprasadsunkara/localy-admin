// app/dashboard/sellers/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import SellersList from "../../../components/verification/SellersList";
import toast from "react-hot-toast";

// Define Seller interface
interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  status: "pending" | "under_review" | "verified" | "rejected";
  documents: Record<string, string>;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export default function SellersPage() {
  // STATE MANAGEMENT
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // LOAD SELLERS ON MOUNT
  useEffect(() => {
    loadSellers();
  }, []);

  // LOAD MOCK SELLERS DATA
  const loadSellers = async () => {
    try {
      setLoading(true);

      // TODO: Replace with real Firestore query
      // const sellersRef = collection(db, 'sellerVerifications');
      // const q = query(sellersRef);
      // const querySnapshot = await getDocs(q);
      // const data = querySnapshot.docs.map(doc => doc.data());

      // FOR NOW: Mock data
      const mockSellers: Seller[] = [
        {
          id: "1",
          name: "Rajesh Kumar",
          email: "rajesh@seller.com",
          phone: "+91 9876543210",
          businessName: "Rajesh Restaurant",
          businessType: "restaurant",
          status: "pending",
          documents: {
            aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
            pan: "https://via.placeholder.com/400x300?text=PAN",
            fssai: "https://via.placeholder.com/400x300?text=FSSAI",
            gst: "https://via.placeholder.com/400x300?text=GST",
          },
          submittedAt: new Date("2024-03-05"),
        },
        {
          id: "2",
          name: "Priya Sharma",
          email: "priya@homechef.com",
          phone: "+91 9876543211",
          businessName: "Priya Home Kitchen",
          businessType: "home_chef",
          status: "pending",
          documents: {
            aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
            pan: "https://via.placeholder.com/400x300?text=PAN",
          },
          submittedAt: new Date("2024-03-04"),
        },
        {
          id: "3",
          name: "Arjun Singh",
          email: "arjun@farmer.com",
          phone: "+91 9876543212",
          businessName: "Arjun Organic Farm",
          businessType: "farmer",
          status: "under_review",
          documents: {
            aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
            pan: "https://via.placeholder.com/400x300?text=PAN",
          },
          submittedAt: new Date("2024-03-03"),
          reviewedBy: "admin@locly.app",
        },
        {
          id: "4",
          name: "Neha Patel",
          email: "neha@grocery.com",
          phone: "+91 9876543213",
          businessName: "Neha Grocery Store",
          businessType: "grocery",
          status: "verified",
          documents: {
            aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
            pan: "https://via.placeholder.com/400x300?text=PAN",
            gst: "https://via.placeholder.com/400x300?text=GST",
          },
          submittedAt: new Date("2024-03-02"),
          reviewedAt: new Date("2024-03-03"),
          reviewedBy: "admin@locly.app",
        },
        {
          id: "5",
          name: "Amit Verma",
          email: "amit@artisan.com",
          phone: "+91 9876543214",
          businessName: "Amit Handicrafts",
          businessType: "artisan",
          status: "rejected",
          documents: {
            aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
            pan: "https://via.placeholder.com/400x300?text=PAN",
          },
          submittedAt: new Date("2024-03-01"),
          reviewedAt: new Date("2024-03-02"),
          reviewedBy: "admin@locly.app",
          rejectionReason: "Documents expired - GST certificate not valid",
        },
      ];

      setSellers(mockSellers);
    } catch (error) {
      console.error("Error loading sellers:", error);
      toast.error("Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };

  // FILTER SELLERS BASED ON FILTER & SEARCH
  const filteredSellers = sellers.filter((seller) => {
    const matchesFilter = filter === "all" || seller.status === filter;
    const matchesSearch =
      seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.businessName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // HANDLE APPROVE
  const handleApprove = async (sellerId: string, notes?: string) => {
    try {
      console.log("Approving seller:", sellerId, "Notes:", notes);

      // TODO: Update in Firestore
      // const sellerRef = doc(db, 'sellerVerifications', sellerId);
      // await updateDoc(sellerRef, {
      //   status: 'verified',
      //   reviewedAt: serverTimestamp(),
      //   reviewedBy: currentUserEmail,
      //   notes: notes,
      // });

      // UPDATE LOCAL STATE
      setSellers(
        sellers.map((s) =>
          s.id === sellerId
            ? {
                ...s,
                status: "verified",
                reviewedAt: new Date(),
                reviewedBy: "admin@locly.app",
              }
            : s
        )
      );

      toast.success("Seller approved successfully! ✅");
    } catch (error) {
      console.error("Error approving seller:", error);
      toast.error("Failed to approve seller");
    }
  };

  // HANDLE REJECT
  const handleReject = async (sellerId: string, reason: string) => {
    try {
      console.log("Rejecting seller:", sellerId, "Reason:", reason);

      // TODO: Update in Firestore
      // const sellerRef = doc(db, 'sellerVerifications', sellerId);
      // await updateDoc(sellerRef, {
      //   status: 'rejected',
      //   rejectionReason: reason,
      //   reviewedAt: serverTimestamp(),
      //   reviewedBy: currentUserEmail,
      // });

      // UPDATE LOCAL STATE
      setSellers(
        sellers.map((s) =>
          s.id === sellerId
            ? {
                ...s,
                status: "rejected",
                rejectionReason: reason,
                reviewedAt: new Date(),
                reviewedBy: "admin@locly.app",
              }
            : s
        )
      );

      toast.success("Seller rejected successfully! ❌");
    } catch (error) {
      console.error("Error rejecting seller:", error);
      toast.error("Failed to reject seller");
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading sellers...</p>
        </div>
      </div>
    );
  }

  // RENDER PAGE
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sellers Verification
        </h1>
        <p className="text-gray-600">
          Review and approve/reject seller applications
        </p>
      </div>

      {/* SEARCH & FILTER SECTION */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* SEARCH INPUT */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* FILTER BUTTONS */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "All", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Under Review", value: "under_review" },
              { label: "Verified", value: "verified" },
              { label: "Rejected", value: "rejected" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === option.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <p className="text-gray-600 text-sm">Verified</p>
          <p className="text-2xl font-bold text-green-500">
            {sellers.filter((s) => s.status === "verified").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-500">
            {sellers.filter((s) => s.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* SELLERS LIST - USING COMPONENT */}
      {filteredSellers.length > 0 ? (
        <SellersList
          sellers={filteredSellers}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-gray-600 font-medium">No sellers found</p>
          <p className="text-gray-500 text-sm mt-1">
            Try adjusting your filters or search query
          </p>
        </div>
      )}

      {/* INFO BOX */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-900 font-semibold mb-2">💡 Pro Tip</p>
        <p className="text-blue-800 text-sm">
          Click on any seller card to expand and view their documents. You can
          zoom in/out on documents for better visibility. All your approvals and
          rejections are automatically logged to the audit trail.
        </p>
      </div>
    </div>
  );
}
