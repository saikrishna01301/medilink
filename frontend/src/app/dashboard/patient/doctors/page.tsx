"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { doctorAPI, DoctorListItem, APIError } from "@/services/api";
import { formatSpecialty } from "@/utils/formatSpecialty";

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<string>("All Specialties");
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [specialtyOptions, setSpecialtyOptions] = useState<string[]>([
    "All Specialties",
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mergeSpecialties = useCallback((incoming: Array<string | null | undefined>) => {
    setSpecialtyOptions((prev) => {
      const existing = new Set(
        prev.filter((option) => option !== "All Specialties")
      );

      incoming.forEach((value) => {
        const cleaned = (value ?? "").trim();
        if (cleaned.length > 0) {
          existing.add(cleaned);
        }
      });

      const sorted = Array.from(existing).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );

      return ["All Specialties", ...sorted];
    });
  }, []);

  const fetchDoctors = useCallback(
    async (filters?: { search?: string; specialty?: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await doctorAPI.listDoctors(filters);
        setDoctors(data);
        mergeSpecialties(data.map((doctor) => doctor.specialty));
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.detail);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unable to load doctors right now.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [mergeSpecialties]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchSpecialties = async () => {
      try {
        const distinct = await doctorAPI.listSpecialties();
        if (!isMounted) return;
        mergeSpecialties(distinct);
      } catch {
        // Ignore specialty load errors; options will be derived from doctor data
      }
    };

    fetchSpecialties();

    return () => {
      isMounted = false;
    };
  }, [mergeSpecialties]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    const specialtyFilter =
      selectedSpecialty !== "All Specialties" ? selectedSpecialty : undefined;
    const searchFilter = debouncedSearchQuery.trim()
      ? debouncedSearchQuery.trim()
      : undefined;

    fetchDoctors({ specialty: specialtyFilter, search: searchFilter });
  }, [debouncedSearchQuery, fetchDoctors, selectedSpecialty]);

  const filteredDoctors = doctors;

  const handleRefresh = () => {
    const specialtyFilter =
      selectedSpecialty !== "All Specialties" ? selectedSpecialty : undefined;
    const searchFilter = debouncedSearchQuery.trim()
      ? debouncedSearchQuery.trim()
      : undefined;
    fetchDoctors({ specialty: specialtyFilter, search: searchFilter });
  };

  const handleBookAppointment = (doctorId: number) => {
    // TODO: Integrate scheduling workflow
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

  const placeholderPhoto = "/Avatar.jpg";

  return (
    <main
      className="flex-1 overflow-y-auto p-4"
      style={{ backgroundColor: "#ECF4F9" }}
    >
      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Find a Doctor</h2>
              <p className="text-sm text-gray-500">
                Browse licensed doctors connected to MediLink and reach out
                directly from your dashboard.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by doctor name, specialty, or keyword"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-12 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
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
            <div>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {specialtyOptions.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty === "All Specialties"
                      ? specialty
                      : formatSpecialty(specialty)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-start justify-between gap-4">
                <p>{error}</p>
                <button
                  onClick={handleRefresh}
                  className="text-sm font-medium text-red-700 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {isLoading
                  ? "Loading doctors..."
                  : `Search Results (${filteredDoctors.length})`}
              </h3>
              {!isLoading && (
                <span className="text-sm text-gray-500">
                  Showing {filteredDoctors.length}{" "}
                  {filteredDoctors.length === 1 ? "doctor" : "doctors"}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`doctor-skeleton-${idx}`}
                    className="animate-pulse rounded-lg border border-gray-200 p-5"
                  >
                    <div className="mb-4 flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-gray-200" />
                        <div className="h-3 w-1/2 rounded bg-gray-200" />
                      </div>
                    </div>
                    <div className="mb-4 space-y-2">
                      <div className="h-3 w-full rounded bg-gray-200" />
                      <div className="h-3 w-5/6 rounded bg-gray-200" />
                    </div>
                    <div className="h-10 w-full rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <p>No doctors found matching your criteria.</p>
                <p className="mt-2 text-sm">
                  Try adjusting your search terms or refresh the list.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredDoctors.map((doctor) => {
                  const fullName = [
                    doctor.first_name,
                    doctor.middle_name,
                    doctor.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const languages = doctor.languages_spoken.filter(Boolean);
                  const certifications = doctor.board_certifications.filter(
                    Boolean
                  );
                  const photoUrl = doctor.photo_url || placeholderPhoto;
                  const isRemotePhoto = doctor.photo_url
                    ? doctor.photo_url.startsWith("http")
                    : false;

                  return (
                    <div
                      key={doctor.id}
                      className="rounded-lg border border-gray-200 p-5 transition-shadow hover:shadow-lg"
                    >
                      <div className="mb-4 flex items-start gap-4">
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                          {isRemotePhoto ? (
                            <img
                              src={photoUrl}
                              alt={fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Image
                              src={photoUrl}
                              alt={fullName}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                              unoptimized={isRemotePhoto}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-semibold text-gray-900">
                            {fullName || "Unknown Doctor"}
                          </h3>
                          {doctor.specialty && (
                            <p className="mt-1 text-sm font-medium text-blue-600">
                              {formatSpecialty(doctor.specialty)}
                            </p>
                          )}
                          {doctor.years_of_experience != null && (
                            <p className="mt-1 text-xs text-gray-500">
                              {doctor.years_of_experience} years experience
                            </p>
                          )}
                        </div>
                      </div>

                      {doctor.bio && (
                        <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                          {doctor.bio}
                        </p>
                      )}

                      <div className="mb-4 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-4 w-4 flex-shrink-0 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a5.5 5.5 0 01-9 0"
                            />
                          </svg>
                          <span className="truncate">{doctor.email}</span>
                        </div>
                        {doctor.phone && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4 flex-shrink-0 text-gray-400"
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
                        )}
                      </div>

                      {languages.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {languages.map((language) => (
                            <span
                              key={`${doctor.id}-lang-${language}`}
                              className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                            >
                              {language}
                            </span>
                          ))}
                        </div>
                      )}

                      {certifications.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {certifications.map((cert) => (
                            <span
                              key={`${doctor.id}-cert-${cert}`}
                              className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleBookAppointment(doctor.id)}
                          className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          Book Appointment
                        </button>
                        <button
                          onClick={() => handleSendMessage(doctor.id)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Message
                        </button>
                        <button
                          onClick={() => handleViewProfile(doctor.id)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Profile
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
