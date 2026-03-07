// app/dashboard/delivery-agents/page.tsx
"use client";

import React, { useState, useEffect } from "react";

interface DeliveryAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  status: "pending" | "under_review" | "verified" | "rejected";
  documents: Record<string, string>;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export default function DeliveryAgentsPage() {
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      // TODO: Replace with real Firestore query
      const mockAgents: DeliveryAgent[] = [
        {
          id: "1",
          name: "Rohit Singh",
          email: "rohit@delivery.com",
          phone: "+91 9876543230",
          vehicleType: "Bike",
          status: "pending",
          documents: {
            license: "https://via.placeholder.com/400x300?text=License",
            aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
            pan: "https://via.placeholder.com/400x300?text=PAN",
            backgroundCheck:
              "https://via.placeholder.com/400x300?text=Background",
          },
          submittedAt: new Date("2024-03-05"),
        },
        {
          id: "2",
          name: "Ananya Gupta",
          email: "ananya@delivery.com",
          phone: "+91 9876543231",
          vehicleType: "Bicycle",
          status: "pending",
          documents: {
            license: "https://via.placeholder.com/400x300?text=License",
            aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
            pan: "https://via.placeholder.com/400x300?text=PAN",
            backgroundCheck:
              "https://via.placeholder.com/400x300?text=Background",
          },
          submittedAt: new Date("2024-03-04"),
        },
      ];

      setAgents(mockAgents);
    } catch (error) {
      console.error("Error loading agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesFilter = filter === "all" || agent.status === filter;
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.vehicleType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = async (agentId: string) => {
    console.log("Approving agent:", agentId);
    // TODO: Update in Firestore
  };

  const handleReject = async (agentId: string, reason: string) => {
    console.log("Rejecting agent:", agentId, "Reason:", reason);
    // TODO: Update in Firestore
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading delivery agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Delivery Agents Verification
        </h1>
        <p className="text-gray-600">
          Review and approve/reject delivery agent applications
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or vehicle type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Pending</p>
          <p className="text-2xl font-bold text-orange-500">
            {agents.filter((a) => a.status === "pending").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Under Review</p>
          <p className="text-2xl font-bold text-blue-500">
            {agents.filter((a) => a.status === "under_review").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Verified</p>
          <p className="text-2xl font-bold text-green-500">
            {agents.filter((a) => a.status === "verified").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-500">
            {agents.filter((a) => a.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* Agents List */}
      {filteredAgents.length > 0 ? (
        <AgentsList
          agents={filteredAgents}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-gray-600 font-medium">No agents found</p>
          <p className="text-gray-500 text-sm mt-1">
            Try adjusting your filters or search query
          </p>
        </div>
      )}
    </div>
  );
}

// ========================================
// AGENTS LIST COMPONENT
// ========================================

interface AgentsListProps {
  agents: DeliveryAgent[];
  onApprove: (agentId: string) => Promise<void>;
  onReject: (agentId: string, reason: string) => Promise<void>;
}

function AgentsList({ agents, onApprove, onReject }: AgentsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState<string | null>(
    null
  );
  const [showRejectionModal, setShowRejectionModal] = useState<string | null>(
    null
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "verified":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Agent Card */}
          <div
            onClick={() =>
              setExpandedId(expandedId === agent.id ? null : agent.id)
            }
            className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                    🚴
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-gray-600">{agent.vehicleType}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      agent.status
                    )}`}
                  >
                    {getStatusLabel(agent.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    📅 {agent.submittedAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{agent.email}</p>
                <p className="text-sm text-gray-600">{agent.phone}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {expandedId === agent.id ? "▲" : "▼"}
                </p>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedId === agent.id && (
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Full Name</p>
                  <p className="font-medium text-gray-900">{agent.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{agent.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">{agent.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vehicle Type</p>
                  <p className="font-medium text-gray-900">
                    {agent.vehicleType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submitted On</p>
                  <p className="font-medium text-gray-900">
                    {agent.submittedAt.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="font-medium text-gray-900">
                    {getStatusLabel(agent.status)}
                  </p>
                </div>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Documents
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(agent.documents).map(([docName, docUrl]) => (
                    <a
                      key={docName}
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 hover:opacity-80 transition-opacity">
                        <img
                          src={docUrl}
                          alt={docName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 capitalize truncate">
                        {docName}
                      </p>
                    </a>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {agent.status === "pending" || agent.status === "under_review" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApprovalModal(agent.id)}
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => setShowRejectionModal(agent.id)}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    ❌ Reject
                  </button>
                  <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
                    💬 Mark Under Review
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-200 rounded-lg">
                  <p className="text-gray-700 font-medium">
                    {agent.status === "verified"
                      ? "✅ Already Verified"
                      : "❌ Rejected"}
                  </p>
                  {agent.rejectionReason && (
                    <p className="text-sm text-gray-600 mt-1">
                      Reason: {agent.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Approval Modal */}
          {showApprovalModal === agent.id && (
            <ApprovalModal
              agentName={agent.name}
              onConfirm={() => {
                onApprove(agent.id);
                setShowApprovalModal(null);
              }}
              onCancel={() => setShowApprovalModal(null)}
            />
          )}

          {/* Rejection Modal */}
          {showRejectionModal === agent.id && (
            <RejectionModal
              agentName={agent.name}
              onConfirm={(reason) => {
                onReject(agent.id, reason);
                setShowRejectionModal(null);
              }}
              onCancel={() => setShowRejectionModal(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ========================================
// APPROVAL MODAL COMPONENT
// ========================================

interface ApprovalModalProps {
  agentName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ApprovalModal({ agentName, onConfirm, onCancel }: ApprovalModalProps) {
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Approve Delivery Agent
        </h2>
        <p className="text-gray-600 mb-4">
          Are you sure you want to approve{" "}
          <span className="font-semibold">{agentName}</span>?
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes about this agent..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
          >
            ✅ Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// REJECTION MODAL COMPONENT
// ========================================

interface RejectionModalProps {
  agentName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

function RejectionModal({
  agentName,
  onConfirm,
  onCancel,
}: RejectionModalProps) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Reject Delivery Agent
        </h2>
        <p className="text-gray-600 mb-4">
          Rejecting <span className="font-semibold">{agentName}</span>. Please
          provide a reason.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rejection Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you rejecting this agent?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            ❌ Reject
          </button>
        </div>
      </div>
    </div>
  );
}
