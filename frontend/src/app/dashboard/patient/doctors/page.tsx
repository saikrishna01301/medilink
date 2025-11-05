"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  photo: string;
  clinic: string;
  address: string;
  phone: string;
  lastVisit: string;
  acceptsInsurance: boolean;
  acceptingNewPatients: boolean;
  availableThisWeek: boolean;
  canPrescribe: boolean;
}

export default function DoctorsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [insuranceFilter, setInsuranceFilter] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [showFindDoctor, setShowFindDoctor] = useState(false);

  // Mock data for "My Care Team"
  const myCareTeam: Doctor[] = [
    {
      id: 1,
      name: "Dr. Orange Cat",
      specialty: "GP & Cardiology",
      photo: "/Avatar.jpg",
      clinic: "Lifeline Clinic",
      address: "123 Medical Center Dr, New York, NY 10001",
      phone: "(555) 123-4567",
      lastVisit: "Oct 10th, 2025",
      acceptsInsurance: true,
      acceptingNewPatients: true,
      availableThisWeek: true,
      canPrescribe: true,
    },
    {
      id: 2,
      name: "Dr. Sarah Johnson",
      specialty: "Dermatology",
      photo: "/Avatar.jpg",
      clinic: "Skin Health Center",
      address: "456 Skin Care Ave, New York, NY 10002",
      phone: "(555) 234-5678",
      lastVisit: "Sep 15th, 2025",
      acceptsInsurance: true,
      acceptingNewPatients: false,
      availableThisWeek: false,
      canPrescribe: true,
    },
    {
      id: 3,
      name: "Dr. Michael Chen",
      specialty: "Orthopedics",
      photo: "/Avatar.jpg",
      clinic: "Bone & Joint Clinic",
      address: "789 Orthopedic St, New York, NY 10003",
      phone: "(555) 345-6789",
      lastVisit: "Aug 20th, 2025",
      acceptsInsurance: true,
      acceptingNewPatients: true,
      availableThisWeek: true,
      canPrescribe: false,
    },
  ];

  // Mock data for "Find a Doctor" - all available doctors
  const allDoctors: Doctor[] = [
    ...myCareTeam,
    {
      id: 4,
      name: "Dr. Emily Rodriguez",
      specialty: "Pediatrics",
      photo: "/Avatar.jpg",
      clinic: "Children's Health Center",
      address: "321 Kids Way, New York, NY 10004",
      phone: "(555) 456-7890",
      lastVisit: "",
      acceptsInsurance: true,
      acceptingNewPatients: true,
      availableThisWeek: true,
      canPrescribe: true,
    },
    {
      id: 5,
      name: "Dr. Robert Kim",
      specialty: "Neurology",
      photo: "/Avatar.jpg",
      clinic: "Brain & Spine Institute",
      address: "654 Neuro Ave, New York, NY 10005",
      phone: "(555) 567-8901",
      lastVisit: "",
      acceptsInsurance: false,
      acceptingNewPatients: true,
      availableThisWeek: false,
      canPrescribe: true,
    },
    {
      id: 6,
      name: "Dr. Lisa Wang",
      specialty: "Endocrinology",
      photo: "/Avatar.jpg",
      clinic: "Metabolic Health Clinic",
      address: "987 Hormone Blvd, New York, NY 10006",
      phone: "(555) 678-9012",
      lastVisit: "",
      acceptsInsurance: true,
      acceptingNewPatients: true,
      availableThisWeek: true,
      canPrescribe: true,
    },
    {
      id: 7,
      name: "Dr. James Wilson",
      specialty: "Cardiology",
      photo: "/Avatar.jpg",
      clinic: "Heart Care Center",
      address: "147 Cardiac Lane, New York, NY 10007",
      phone: "(555) 789-0123",
      lastVisit: "",
      acceptsInsurance: true,
      acceptingNewPatients: false,
      availableThisWeek: true,
      canPrescribe: true,
    },
  ];

  const specialties = [
    "All Specialties",
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "General Practice",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
  ];

  // Filter doctors for "Find a Doctor" section
  const filteredDoctors = allDoctors.filter((doctor) => {
    const matchesSearch =
      searchQuery === "" ||
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.clinic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === "" ||
      selectedSpecialty === "All Specialties" ||
      doctor.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());

    const matchesInsurance = !insuranceFilter || doctor.acceptsInsurance;

    const matchesAvailability =
      availabilityFilter === "" ||
      (availabilityFilter === "new" && doctor.acceptingNewPatients) ||
      (availabilityFilter === "week" && doctor.availableThisWeek);

    return (
      matchesSearch &&
      matchesSpecialty &&
      matchesInsurance &&
      matchesAvailability
    );
  });

  const handleBookAppointment = (doctorId: number) => {
    // TODO: Implement booking logic
    console.log("Book appointment for doctor:", doctorId);
  };

  const handleSendMessage = (doctorId: number) => {
    // TODO: Navigate to chats with doctor pre-selected
    console.log("Send message to doctor:", doctorId);
  };

  const handleViewProfile = (doctorId: number) => {
    // TODO: Navigate to doctor profile page
    console.log("View profile for doctor:", doctorId);
  };

  const handleRequestRefill = (doctorId: number) => {
    // TODO: Implement refill request logic
    console.log("Request refill from doctor:", doctorId);
  };

  return (
    <main className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: "#ECF4F9" }}>
      <div className="space-y-6">
        {/* My Care Team Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Care Team</h2>
            <button
              onClick={() => setShowFindDoctor(!showFindDoctor)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {showFindDoctor ? "Hide Find Doctor" : "+ Find a Doctor"}
            </button>
          </div>

          {myCareTeam.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>You don&apos;t have any doctors in your care team yet.</p>
              <p className="mt-2">Click &quot;Find a Doctor&quot; to add doctors to your care team.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCareTeam.map((doctor) => (
                <div
                  key={doctor.id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      <Image
                        src={doctor.photo}
                        alt={doctor.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">
                        {doctor.name}
                      </h3>
                      <p className="text-sm text-blue-600 font-medium mt-1">
                        {doctor.specialty}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span className="line-clamp-2">{doctor.clinic}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="line-clamp-2">{doctor.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span>{doctor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-xs">Last Visit: {doctor.lastVisit}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleBookAppointment(doctor.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Book Appointment
                    </button>
                    <button
                      onClick={() => handleSendMessage(doctor.id)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Message
                    </button>
                    <button
                      onClick={() => handleViewProfile(doctor.id)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Profile
                    </button>
                    {doctor.canPrescribe && (
                      <button
                        onClick={() => handleRequestRefill(doctor.id)}
                        className="w-full px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium mt-2"
                      >
                        Request Refill
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Find a Doctor Section */}
        {showFindDoctor && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Find a Doctor</h2>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Doctor Name, Specialty, or Condition (e.g., 'headaches')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-400"
                />
                <svg
                  className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Specialty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialty
                </label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Insurance Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={insuranceFilter}
                    onChange={(e) => setInsuranceFilter(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Accepts my insurance
                  </span>
                </label>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ZIP code"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    title="Use my location"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Availability Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Availability</option>
                  <option value="new">Accepting New Patients</option>
                  <option value="week">Available This Week</option>
                </select>
              </div>
            </div>

            {/* Search Results */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Search Results ({filteredDoctors.length})
                </h3>
                {filteredDoctors.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedSpecialty("");
                      setInsuranceFilter(false);
                      setLocationFilter("");
                      setAvailabilityFilter("");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {filteredDoctors.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No doctors found matching your criteria.</p>
                  <p className="mt-2">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          <Image
                            src={doctor.photo}
                            alt={doctor.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg truncate">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-blue-600 font-medium mt-1">
                            {doctor.specialty}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          <span className="line-clamp-1">{doctor.clinic}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="line-clamp-2">{doctor.address}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {doctor.acceptsInsurance && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            Accepts Insurance
                          </span>
                        )}
                        {doctor.acceptingNewPatients && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            Accepting New Patients
                          </span>
                        )}
                        {doctor.availableThisWeek && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                            Available This Week
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleBookAppointment(doctor.id)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Book Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
