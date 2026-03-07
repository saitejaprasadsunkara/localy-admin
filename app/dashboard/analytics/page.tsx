// app/dashboard/analytics/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsData {
  approvalTrend: Array<{ date: string; approved: number; rejected: number }>;
  adminPerformance: Array<{
    name: string;
    approvals: number;
    rejections: number;
  }>;
  verificationBreakdown: Array<{ name: string; value: number }>;
  responseTime: Array<{ date: string; avgTime: number }>;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // TODO: Replace with real Firestore query
      const mockData: AnalyticsData = {
        approvalTrend: [
          { date: "Mar 1", approved: 12, rejected: 2 },
          { date: "Mar 2", approved: 18, rejected: 3 },
          { date: "Mar 3", approved: 15, rejected: 2 },
          { date: "Mar 4", approved: 22, rejected: 4 },
          { date: "Mar 5", approved: 25, rejected: 3 },
          { date: "Mar 6", approved: 19, rejected: 2 },
        ],
        adminPerformance: [
          { name: "Priya Sharma", approvals: 45, rejections: 8 },
          { name: "Rajesh Kumar", approvals: 32, rejections: 5 },
          { name: "Arjun Singh", approvals: 28, rejections: 6 },
          { name: "Ananya Gupta", approvals: 15, rejections: 2 },
        ],
        verificationBreakdown: [
          { name: "Sellers", value: 60 },
          { name: "Drivers", value: 25 },
          { name: "Delivery Agents", value: 15 },
        ],
        responseTime: [
          { date: "Mar 1", avgTime: 2.5 },
          { date: "Mar 2", avgTime: 2.2 },
          { date: "Mar 3", avgTime: 2.8 },
          { date: "Mar 4", avgTime: 2.1 },
          { date: "Mar 5", avgTime: 1.9 },
          { date: "Mar 6", avgTime: 2.3 },
        ],
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const COLORS = ["#F97316", "#22C55E", "#3B82F6"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time metrics and performance insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-1">Total Approvals</p>
          <p className="text-3xl font-bold text-orange-500">111</p>
          <p className="text-xs text-green-600 mt-2">↑ 12% from last week</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-1">Total Rejections</p>
          <p className="text-3xl font-bold text-red-500">17</p>
          <p className="text-xs text-green-600 mt-2">↓ 5% from last week</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-1">Success Rate</p>
          <p className="text-3xl font-bold text-green-500">86.7%</p>
          <p className="text-xs text-green-600 mt-2">↑ 3% from last week</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-1">Avg Response Time</p>
          <p className="text-3xl font-bold text-blue-500">2.3h</p>
          <p className="text-xs text-green-600 mt-2">↓ 0.5h from last week</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Approval Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.approvalTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="approved"
                stroke="#22C55E"
                strokeWidth={2}
                name="Approved"
              />
              <Line
                type="monotone"
                dataKey="rejected"
                stroke="#EF4444"
                strokeWidth={2}
                name="Rejected"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Admin Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Admin Performance
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.adminPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="approvals" fill="#22C55E" name="Approvals" />
              <Bar dataKey="rejections" fill="#EF4444" name="Rejections" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Verification Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Verification Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.verificationBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${value}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.verificationBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Average Response Time (hours)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.responseTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgTime"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Avg Response Time"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Admin Detailed Stats
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Admin Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Approvals
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Rejections
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Success Rate
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Total Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.adminPerformance.map((admin) => {
                const total = admin.approvals + admin.rejections;
                const successRate = ((admin.approvals / total) * 100).toFixed(
                  1
                );
                return (
                  <tr
                    key={admin.name}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      {admin.name}
                    </td>
                    <td className="py-3 px-4 text-green-600 font-semibold">
                      {admin.approvals}
                    </td>
                    <td className="py-3 px-4 text-red-600 font-semibold">
                      {admin.rejections}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${successRate}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-900 font-medium text-sm">
                          {successRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-semibold">
                      {total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors">
          📊 Export Report (PDF)
        </button>
      </div>
    </div>
  );
}
