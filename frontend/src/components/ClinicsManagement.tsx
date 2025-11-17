"use client";

import { useEffect, useRef, useState } from "react";
import { doctorAPI, Address, APIError } from "@/services/api";
import DoctorMapWidget from "./DoctorMapWidget";

interface ClinicsManagementProps {
  onUpdate?: () => void;
}

export default function ClinicsManagement({ onUpdate }: ClinicsManagementProps) {
  const [clinics, setClinics] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingClinicId, setEditingClinicId] = useState<number | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Address | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingClinicId, setDeletingClinicId] = useState<number | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);

  const [clinicForm, setClinicForm] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country_code: "US",
    label: "",
  });
  const [postalLookupStatus, setPostalLookupStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const lastPostalLookupRef = useRef<string>("");

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorAPI.listClinics();
      setClinics(data);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to load clinics");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClinicForm({
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country_code: "US",
      label: "",
    });
    setEditingClinicId(null);
    setShowAddForm(false);
    setPostalLookupStatus("idle");
    lastPostalLookupRef.current = "";
  };

  const startEditing = (clinic: Address) => {
    setEditingClinicId(clinic.address_id);
    setClinicForm({
      address_line1: clinic.address_line1,
      address_line2: clinic.address_line2 || "",
      city: clinic.city,
      state: clinic.state || "",
      postal_code: clinic.postal_code || "",
      country_code: clinic.country_code || "US",
      label: clinic.label || "",
    });
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!clinicForm.address_line1.trim() || !clinicForm.city.trim()) {
      setError("Address Line 1 and City are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        address_line1: clinicForm.address_line1.trim(),
        address_line2: clinicForm.address_line2.trim() || undefined,
        city: clinicForm.city.trim(),
        state: clinicForm.state.trim() || undefined,
        postal_code: clinicForm.postal_code.trim() || undefined,
        country_code: clinicForm.country_code.trim() || undefined,
        label: clinicForm.label.trim() || undefined,
      };

      if (editingClinicId) {
        await doctorAPI.updateClinic(editingClinicId, payload);
        setSuccess("Clinic updated successfully!");
      } else {
        await doctorAPI.createClinic(payload);
        setSuccess("Clinic added successfully!");
      }

      resetForm();
      await loadClinics();
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to save clinic");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  const lookupCityStateByPostal = async (postal: string) => {
    const trimmed = postal.trim();
    if (
      trimmed.length < 5 ||
      (clinicForm.country_code || "US").toUpperCase() !== "US" ||
      trimmed === lastPostalLookupRef.current
    ) {
      return;
    }
    lastPostalLookupRef.current = trimmed;
    try {
      setPostalLookupStatus("loading");
      const response = await fetch(`https://api.zippopotam.us/us/${trimmed}`);
      if (!response.ok) {
        throw new Error("Postal lookup failed");
      }
      const data = await response.json();
      const place = data.places?.[0];
      if (place) {
        setClinicForm((prev) => ({
          ...prev,
          city: place["place name"] || prev.city,
          state: place["state abbreviation"] || prev.state,
        }));
        setPostalLookupStatus("success");
      } else {
        setPostalLookupStatus("error");
      }
    } catch {
      setPostalLookupStatus("error");
      lastPostalLookupRef.current = "";
    }
  };

  const handleDelete = async (clinicId: number) => {
    if (!confirm("Are you sure you want to delete this clinic?")) {
      return;
    }

    try {
      setDeletingClinicId(clinicId);
      setError(null);
      setSuccess(null);

      await doctorAPI.deleteClinic(clinicId);
      setSuccess("Clinic deleted successfully!");
      await loadClinics();
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to delete clinic");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setDeletingClinicId(null);
    }
  };

  const handleSetPrimary = async (clinicId: number) => {
    try {
      setSettingPrimaryId(clinicId);
      setError(null);
      setSuccess(null);

      await doctorAPI.setPrimaryClinic(clinicId);
      setSuccess("Primary clinic updated successfully!");
      await loadClinics();
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to set primary clinic");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const clinicsForMap = clinics.length > 0 ? [{
    id: 0,
    first_name: "My",
    middle_name: null,
    last_name: "Clinics",
    email: "",
    phone: null,
    specialty: null,
    bio: null,
    photo_url: null,
    years_of_experience: null,
    languages_spoken: [],
    board_certifications: [],
    accepting_new_patients: false,
    offers_virtual_visits: false,
    cover_photo_url: null,
    address_line1: clinics[0]?.address_line1 || "",
    address_line2: clinics[0]?.address_line2 || null,
    city: clinics[0]?.city || "",
    state: clinics[0]?.state || null,
    postal_code: clinics[0]?.postal_code || null,
    country_code: clinics[0]?.country_code || null,
    latitude: clinics[0]?.latitude || null,
    longitude: clinics[0]?.longitude || null,
    place_id: clinics[0]?.place_id || null,
    google_rating: null,
    google_user_ratings_total: null,
    distance_km: null,
    clinics: clinics.map((clinic) => ({
      address_id: clinic.address_id,
      label: clinic.label,
      address_line1: clinic.address_line1,
      address_line2: clinic.address_line2,
      city: clinic.city,
      state: clinic.state,
      postal_code: clinic.postal_code,
      country_code: clinic.country_code,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      place_id: clinic.place_id,
      is_primary: clinic.is_primary,
      distance_km: null,
    })),
  }] : [];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Loading clinics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Clinics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your practice locations. All locations will appear when patients search for you.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Add Clinic
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {(showAddForm || editingClinicId !== null) && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingClinicId ? "Edit Clinic" : "Add New Clinic"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clinic Name / Label
              </label>
              <input
                type="text"
                value={clinicForm.label}
                onChange={(e) =>
                  setClinicForm({ ...clinicForm, label: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="e.g., Main Office, Downtown Clinic"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                value={clinicForm.address_line1}
                onChange={(e) =>
                  setClinicForm({ ...clinicForm, address_line1: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="Street address"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={clinicForm.address_line2}
                onChange={(e) =>
                  setClinicForm({ ...clinicForm, address_line2: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="Suite, floor, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={clinicForm.city}
                onChange={(e) =>
                  setClinicForm({ ...clinicForm, city: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={clinicForm.state}
                onChange={(e) =>
                  setClinicForm({ ...clinicForm, state: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={clinicForm.postal_code}
                onChange={(e) => {
                  const value = e.target.value;
                  setClinicForm({ ...clinicForm, postal_code: value });
                  if (value.trim().length >= 5) {
                    lookupCityStateByPostal(value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="ZIP code"
              />
              {postalLookupStatus === "loading" && (
                <p className="text-xs text-blue-600 mt-1">
                  Looking up city and state…
                </p>
              )}
              {postalLookupStatus === "success" && (
                <p className="text-xs text-green-600 mt-1">
                  City and state filled automatically.
                </p>
              )}
              {postalLookupStatus === "error" && (
                <p className="text-xs text-red-600 mt-1">
                  Could not determine city/state for this ZIP. Please enter
                  manually.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country Code
              </label>
              <input
                type="text"
                value={clinicForm.country_code}
                maxLength={2}
                onChange={(e) =>
                  setClinicForm({
                    ...clinicForm,
                    country_code: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="US"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : editingClinicId ? "Update Clinic" : "Add Clinic"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="order-2 lg:order-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Locations</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {clinics.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                <p>No clinics added yet.</p>
                <p className="text-sm mt-2">Click "Add Clinic" to add your first location.</p>
              </div>
            ) : (
              clinics.map((clinic, idx) => {
                const isEditing = editingClinicId === clinic.address_id;
                const isSelected = selectedClinic?.address_id === clinic.address_id;

                return (
                  <div
                    key={clinic.address_id ?? `clinic-${idx}-${clinic.address_line1}`}
                    onClick={() => setSelectedClinic(clinic)}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {clinic.label || clinic.address_line1 || "Clinic"}
                          </h4>
                          {clinic.is_primary && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {clinic.address_line1}
                          {clinic.address_line2 && `, ${clinic.address_line2}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {[clinic.city, clinic.state, clinic.postal_code]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {clinic.latitude && clinic.longitude && (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {clinic.latitude.toFixed(4)}, {clinic.longitude.toFixed(4)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {!clinic.is_primary && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetPrimary(clinic.address_id);
                            }}
                            disabled={settingPrimaryId === clinic.address_id}
                            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition disabled:opacity-50"
                          >
                            {settingPrimaryId === clinic.address_id
                              ? "Setting..."
                              : "Set Primary"}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(clinic);
                          }}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(clinic.address_id);
                          }}
                          disabled={deletingClinicId === clinic.address_id}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-50"
                        >
                          {deletingClinicId === clinic.address_id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Map View</h3>
          <div className="h-[600px] rounded-lg border border-gray-200 overflow-hidden">
            {clinics.length > 0 ? (
              <DoctorMapWidget
                doctors={clinicsForMap}
                onDoctorClick={(doctor) => {
                  const clinic = clinics.find(
                    (c) => c.address_id === doctor.clinics?.[0]?.address_id
                  );
                  if (clinic) setSelectedClinic(clinic);
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500">
                <p>Add clinics to see them on the map</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

