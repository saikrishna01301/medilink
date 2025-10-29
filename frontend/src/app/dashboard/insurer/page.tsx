"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function InsurerDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    } else if (!isLoading && user?.role !== "insurer") {
      // Redirect to appropriate dashboard if wrong role
      router.push(`/dashboard/${user?.role}`);
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "insurer") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[1280px]">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="MediLink" className="h-10" />
            <h1 className="text-2xl font-bold text-gray-900">Insurer Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg shadow p-6 mb-6 text-white">
          <h2 className="text-2xl font-semibold mb-2">
            Welcome back, {user.first_name}!
          </h2>
          <p className="text-indigo-100">
            Manage claims, review policies, and streamline your insurance operations.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Claims</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">87</p>
                <p className="text-xs text-yellow-600 mt-1">↑ 12% from last week</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Approved Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">34</p>
                <p className="text-xs text-green-600 mt-1">$145,230 total</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Policies</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">1,234</p>
                <p className="text-xs text-blue-600 mt-1">↑ 5% this month</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Payout</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$2.3M</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Claims */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Claims</h3>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
                <option>All Claims</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3">Claim ID</th>
                      <th className="pb-3">Patient</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {[
                      { id: "CLM-2024-001", patient: "John Doe", amount: "$1,200", status: "Pending" },
                      { id: "CLM-2024-002", patient: "Jane Smith", amount: "$3,450", status: "Approved" },
                      { id: "CLM-2024-003", patient: "Mike Johnson", amount: "$890", status: "Pending" },
                      { id: "CLM-2024-004", patient: "Sarah Williams", amount: "$2,100", status: "Under Review" },
                      { id: "CLM-2024-005", patient: "David Brown", amount: "$1,560", status: "Approved" },
                    ].map((claim, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-4 font-medium text-gray-900">{claim.id}</td>
                        <td className="py-4">{claim.patient}</td>
                        <td className="py-4 font-semibold">{claim.amount}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            claim.status === "Approved" ? "bg-green-100 text-green-700" :
                            claim.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {claim.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Claim Processing Time */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Avg. Processing Time</h3>
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">2.3</p>
                <p className="text-gray-500 mt-1">days</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="bg-green-100 rounded-full p-1">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-sm text-green-600">15% faster</span>
                </div>
              </div>
            </div>

            {/* Approval Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Rate</h3>
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">87%</p>
                <p className="text-gray-500 mt-1">this month</p>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "87%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Summary */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Policy Distribution</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { type: "Health Insurance", count: 567, color: "blue" },
                { type: "Life Insurance", count: 423, color: "green" },
                { type: "Dental Coverage", count: 244, color: "purple" },
              ].map((policy, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className={`w-3 h-3 rounded-full bg-${policy.color}-500 mb-2`}></div>
                  <h4 className="font-semibold text-gray-900">{policy.type}</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{policy.count}</p>
                  <p className="text-sm text-gray-500">Active policies</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

