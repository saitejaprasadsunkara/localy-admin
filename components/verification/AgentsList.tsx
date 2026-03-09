// components/verification/AgentsList.tsx
"use client";

import React, { useState } from "react";
import DocumentViewer from "./DocumentViewer";
import ApprovalModal from "./ApprovalModal";
import RejectionModal from "./RejectionModal";

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

interface AgentsListProps {
  agents: DeliveryAgent[];
  onApprove: (agentId: string) => Promise<void>;
  onReject: (agentId: string, reason: string) => Promise<void>;
}

export default function AgentsList({
  agents,
  onApprove,
  onReject,
}: AgentsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvalAgent, setApprovalAgent] = useState<string | null>(null);
  const [rejectionAgent, setRejectionAgent] = useState<string | null>(null);

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
          {/* Agent Card Header */}
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
                <div className="flex gap-3 mt-2 flex-wrap">
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
                  <span className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                    {agent.vehicleType}
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
              {/* Agent Details */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Delivery Agent Information
                </h4>
                <div className="grid grid-cols-2 gap-6">
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
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <p className="font-medium text-gray-900">
                      {getStatusLabel(agent.status)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Submitted On</p>
                    <p className="font-medium text-gray-900">
                      {agent.submittedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <DocumentViewer
                  documents={agent.documents}
                  title="Delivery Agent Documents"
                />
              </div>

              {/* Actions */}
              {agent.status === "pending" || agent.status === "under_review" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setApprovalAgent(agent.id)}
                    className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    ✅ Approve Agent
                  </button>
                  <button
                    onClick={() => setRejectionAgent(agent.id)}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    ❌ Reject Agent
                  </button>
                  <button className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
                    💬 Mark Under Review
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-300 rounded-lg">
                  <p className="text-gray-700 font-medium">
                    {agent.status === "verified"
                      ? "✅ Already Verified"
                      : "❌ Rejected"}
                  </p>
                  {agent.rejectionReason && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Reason:</strong> {agent.rejectionReason}
                    </p>
                  )}
                  {agent.reviewedBy && (
                    <p className="text-xs text-gray-600 mt-1">
                      Reviewed by: {agent.reviewedBy}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modals */}
          <ApprovalModal
            isOpen={approvalAgent === agent.id}
            title="Approve Delivery Agent"
            name={agent.name}
            onConfirm={async () => {
              await onApprove(agent.id);
              setApprovalAgent(null);
            }}
            onCancel={() => setApprovalAgent(null)}
          />

          <RejectionModal
            isOpen={rejectionAgent === agent.id}
            title="Reject Delivery Agent"
            name={agent.name}
            onConfirm={async (reason) => {
              await onReject(agent.id, reason);
              setRejectionAgent(null);
            }}
            onCancel={() => setRejectionAgent(null)}
          />
        </div>
      ))}
    </div>
  );
}
