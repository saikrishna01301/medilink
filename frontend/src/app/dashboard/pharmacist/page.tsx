"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function PharmacistDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    } else if (!isLoading && user?.role !== "pharmacist") {
      // Redirect to appropriate dashboard if wrong role
      router.push(`/dashboard/${user?.role}`);
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "pharmacist") {
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
            <h1 className="text-2xl font-bold text-gray-900">Pharmacist Dashboard</h1>
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
        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg shadow p-6 mb-6 text-white">
          <h2 className="text-2xl font-semibold mb-2">
            Welcome back, {user.first_name}!
          </h2>
          <p className="text-green-100">
            Manage prescriptions, track inventory, and serve your patients efficiently.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">23</p>
                <p className="text-xs text-yellow-600 mt-1">Awaiting processing</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Completed Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">48</p>
                <p className="text-xs text-green-600 mt-1">↑ 18% from yesterday</p>
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
                <p className="text-gray-500 text-sm font-medium">Low Stock Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
                <p className="text-xs text-red-600 mt-1">Needs reordering</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$8.2K</p>
                <p className="text-xs text-gray-500 mt-1">This week</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Pending Prescriptions */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Pending Prescriptions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { id: "RX-2024-156", patient: "Alice Johnson", medication: "Amoxicillin 500mg", quantity: "30 tablets", time: "10 mins ago" },
                  { id: "RX-2024-157", patient: "Bob Wilson", medication: "Lisinopril 10mg", quantity: "90 tablets", time: "25 mins ago" },
                  { id: "RX-2024-158", patient: "Carol Martinez", medication: "Metformin 500mg", quantity: "60 tablets", time: "1 hour ago" },
                  { id: "RX-2024-159", patient: "David Lee", medication: "Atorvastatin 20mg", quantity: "30 tablets", time: "2 hours ago" },
                ].map((prescription, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{prescription.id}</p>
                        <p className="text-sm text-gray-600">{prescription.patient}</p>
                      </div>
                      <span className="text-xs text-gray-500">{prescription.time}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{prescription.medication}</p>
                        <p className="text-xs text-gray-500">{prescription.quantity}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition">
                          Approve
                        </button>
                        <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition text-left flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Prescription
                </button>
                <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition text-left flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Check Inventory
                </button>
                <button className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition text-left flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Order Supplies
                </button>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h3>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Low Stock</p>
                  <p className="text-xs text-red-600 mt-1">12 items need reordering</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Expiring Soon</p>
                  <p className="text-xs text-yellow-600 mt-1">8 items expire this month</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Overview</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All →
            </button>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3">Medication</th>
                    <th className="pb-3">Stock</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Expiry</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { name: "Amoxicillin 500mg", stock: "450", status: "In Stock", expiry: "Dec 2025" },
                    { name: "Lisinopril 10mg", stock: "28", status: "Low Stock", expiry: "Jan 2026" },
                    { name: "Metformin 500mg", stock: "380", status: "In Stock", expiry: "Mar 2026" },
                    { name: "Atorvastatin 20mg", stock: "15", status: "Low Stock", expiry: "Nov 2025" },
                    { name: "Omeprazole 40mg", stock: "210", status: "In Stock", expiry: "Feb 2026" },
                  ].map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-4 font-medium text-gray-900">{item.name}</td>
                      <td className="py-4">{item.stock}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === "In Stock" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 text-gray-600">{item.expiry}</td>
                      <td className="py-4">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Reorder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

