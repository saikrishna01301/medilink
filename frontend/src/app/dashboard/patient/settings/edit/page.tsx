"use client";

import { useEffect, useRef, useState } from "react";
import {
  patientAPI,
  PatientProfileData,
  PatientConditionStatus,
  PatientDiagnosisStatus,
  PatientConditionInput,
  PatientDiagnosisInput,
} from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

type ConditionDraft = {
  condition_name: string;
  status: PatientConditionStatus;
};

type DiagnosisDraft = {
  disease_name: string;
  status: PatientDiagnosisStatus;
};

const CONDITION_STATUS_OPTIONS: PatientConditionStatus[] = ["active", "managed", "resolved"];
const DIAGNOSIS_STATUS_OPTIONS: PatientDiagnosisStatus[] = ["active", "in_remission", "resolved"];

export default function PatientProfileEditPage() {
  const { user, setUser } = useAuth();
  const [profileData, setProfileData] = useState<PatientProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [savingHealth, setSavingHealth] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [deletingCover, setDeletingCover] = useState(false);

  const [userInfo, setUserInfo] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone: "",
    emergency_contact: "",
  });

  const [healthInfo, setHealthInfo] = useState({
    date_of_birth: "",
    gender: "",
    blood_type: "",
    bio: "",
    height_cm: "",
    weight_kg: "",
  });

  const [conditions, setConditions] = useState<ConditionDraft[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisDraft[]>([]);

  const [newCondition, setNewCondition] = useState<ConditionDraft>({
    condition_name: "",
    status: "active",
  });
  const [newDiagnosis, setNewDiagnosis] = useState<DiagnosisDraft>({
    disease_name: "",
    status: "active",
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await patientAPI.getProfile();
        setProfileData(data);
        setError(null);

        setUserInfo({
          first_name: data.user.first_name || "",
          middle_name: data.user.middle_name || "",
          last_name: data.user.last_name || "",
          phone: data.user.phone || "",
          emergency_contact: data.user.emergency_contact || "",
        });

        setHealthInfo({
          date_of_birth: data.profile?.date_of_birth || "",
          gender: data.profile?.gender || "",
          blood_type: data.profile?.blood_type || "",
          bio: data.profile?.bio || "",
          height_cm: data.profile?.current_height_cm?.toString() || "",
          weight_kg: data.profile?.current_weight_kg?.toString() || "",
        });

        setConditions(
          data.medical_conditions.map((condition) => ({
            condition_name: condition.condition_name,
            status: condition.status,
          }))
        );
        setDiagnoses(
          data.diagnosed_diseases.map((diagnosis) => ({
            disease_name: diagnosis.disease_name,
            status: diagnosis.status,
          }))
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 4000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const handleSaveUserInfo = async () => {
    try {
      setSavingUser(true);
      const payload = {
        first_name: userInfo.first_name.trim() || undefined,
        middle_name: userInfo.middle_name.trim() || undefined,
        last_name: userInfo.last_name.trim() || undefined,
        phone: userInfo.phone.trim() || undefined,
        emergency_contact: userInfo.emergency_contact.trim() || undefined,
      };
      const updated = await patientAPI.updateUserInfo(payload);
      setProfileData(updated);
      showSuccess("Personal information updated successfully.");
      if (user) {
        setUser({
          ...user,
          first_name: payload.first_name || user.first_name,
          last_name: payload.last_name || user.last_name,
          phone: payload.phone || user.phone,
        });
      }
    } catch (err) {
      console.error(err);
      showError("Failed to update personal information.");
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveHealthProfile = async () => {
    try {
      setSavingHealth(true);
      const conditionPayload: PatientConditionInput[] = conditions
        .filter((condition) => condition.condition_name.trim())
        .map((condition) => ({
          condition_name: condition.condition_name.trim(),
          status: condition.status,
        }));
      const diagnosisPayload: PatientDiagnosisInput[] = diagnoses
        .filter((diagnosis) => diagnosis.disease_name.trim())
        .map((diagnosis) => ({
          disease_name: diagnosis.disease_name.trim(),
          status: diagnosis.status,
        }));

      const profilePayload = {
        bio: healthInfo.bio.trim() || undefined,
        date_of_birth: healthInfo.date_of_birth || undefined,
        gender: healthInfo.gender.trim() || undefined,
        blood_type: healthInfo.blood_type.trim() || undefined,
        height_cm: healthInfo.height_cm ? parseFloat(healthInfo.height_cm) : undefined,
        weight_kg: healthInfo.weight_kg ? parseFloat(healthInfo.weight_kg) : undefined,
        medical_conditions: conditionPayload,
        diagnosed_diseases: diagnosisPayload,
      };

      const updated = await patientAPI.updateProfile(profilePayload);
      setProfileData(updated);
      showSuccess("Health profile updated successfully.");
    } catch (err) {
      console.error(err);
      showError("Failed to update health profile.");
    } finally {
      setSavingHealth(false);
    }
  };

  const handleAddCondition = () => {
    if (!newCondition.condition_name.trim()) return;
    setConditions((prev) => [
      ...prev,
      {
        condition_name: newCondition.condition_name.trim(),
        status: newCondition.status,
      },
    ]);
    setNewCondition({ condition_name: "", status: "active" });
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDiagnosis = () => {
    if (!newDiagnosis.disease_name.trim()) return;
    setDiagnoses((prev) => [
      ...prev,
      {
        disease_name: newDiagnosis.disease_name.trim(),
        status: newDiagnosis.status,
      },
    ]);
    setNewDiagnosis({ disease_name: "", status: "active" });
  };

  const handleRemoveDiagnosis = (index: number) => {
    setDiagnoses((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPhoto(true);
      const response = await patientAPI.uploadProfilePicture(file);
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              profile: prev.profile ? { ...prev.profile, photo_url: response.photo_url } : prev.profile,
            }
          : prev
      );
      if (user) {
        setUser({ ...user, photo_url: response.photo_url });
      }
      showSuccess("Profile picture updated.");
    } catch (err) {
      console.error(err);
      showError("Failed to upload profile picture.");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  const handlePhotoDelete = async () => {
    try {
      setDeletingPhoto(true);
      await patientAPI.deleteProfilePicture();
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              profile: prev.profile ? { ...prev.profile, photo_url: null } : prev.profile,
            }
          : prev
      );
      if (user) {
        setUser({ ...user, photo_url: undefined });
      }
      showSuccess("Profile picture removed.");
    } catch (err) {
      console.error(err);
      showError("Failed to delete profile picture.");
    } finally {
      setDeletingPhoto(false);
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCover(true);
      const response = await patientAPI.uploadCoverPhoto(file);
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              profile: prev.profile ? { ...prev.profile, cover_photo_url: response.cover_photo_url } : prev.profile,
            }
          : prev
      );
      showSuccess("Cover photo updated.");
    } catch (err) {
      console.error(err);
      showError("Failed to upload cover photo.");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

  const handleCoverDelete = async () => {
    try {
      setDeletingCover(true);
      await patientAPI.deleteCoverPhoto();
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              profile: prev.profile ? { ...prev.profile, cover_photo_url: null } : prev.profile,
            }
          : prev
      );
      showSuccess("Cover photo removed.");
    } catch (err) {
      console.error(err);
      showError("Failed to delete cover photo.");
    } finally {
      setDeletingCover(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#ECF4F9" }}>
        <div className="text-gray-600 text-lg">Loading profile editor...</div>
      </main>
    );
  }

  const profilePhoto = profileData?.profile?.photo_url ?? null;
  const coverPhoto = profileData?.profile?.cover_photo_url ?? null;

  return (
    <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#ECF4F9" }}>
      <section className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 bg-white rounded-3xl shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Patient Profile</h1>
              <p className="text-gray-600">
                Upload your photo, update health metrics, and manage tracked conditions.
              </p>
            </div>
            <Link
              href="/dashboard/patient/settings"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition"
            >
              ← Back to profile
            </Link>
          </div>
          {success && <Alert type="success" message={success} />}
          {error && <Alert type="error" message={error} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Profile picture</h2>
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Patient" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-gray-500">
                    {user?.first_name?.[0]?.toUpperCase() || "P"}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Update photo</label>
                <div className="flex flex-wrap gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    ref={photoInputRef}
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? "Uploading..." : profilePhoto ? "Replace photo" : "Upload photo"}
                  </button>
                  {profilePhoto && (
                    <button
                      onClick={handlePhotoDelete}
                      className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition disabled:opacity-60"
                      disabled={deletingPhoto}
                    >
                      {deletingPhoto ? "Removing..." : "Remove"}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">JPEG, PNG, or WebP up to 5MB.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Cover image</h2>
            <div className="rounded-2xl border border-dashed border-gray-300 overflow-hidden bg-gray-50">
              {coverPhoto ? (
                <img src={coverPhoto} alt="Cover" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 flex flex-col items-center justify-center text-gray-400 text-sm">
                  <span className="text-2xl mb-2">🖼️</span>
                  No cover uploaded
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                type="file"
                accept="image/*"
                ref={coverInputRef}
                className="hidden"
                onChange={handleCoverUpload}
              />
              <button
                onClick={() => coverInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
                disabled={uploadingCover}
              >
                {uploadingCover ? "Uploading..." : coverPhoto ? "Replace cover" : "Upload cover"}
              </button>
              {coverPhoto && (
                <button
                  onClick={handleCoverDelete}
                  className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition disabled:opacity-60"
                  disabled={deletingCover}
                >
                  {deletingCover ? "Removing..." : "Remove"}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">Recommended 1600 × 400 px, up to 8MB.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Personal information</h2>
            <button
              onClick={handleSaveUserInfo}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
              disabled={savingUser}
            >
              {savingUser ? "Saving..." : "Save"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="First name"
              value={userInfo.first_name}
              onChange={(value) => setUserInfo((prev) => ({ ...prev, first_name: value }))}
              required
            />
            <TextInput
              label="Middle name"
              value={userInfo.middle_name}
              onChange={(value) => setUserInfo((prev) => ({ ...prev, middle_name: value }))}
            />
            <TextInput
              label="Last name"
              value={userInfo.last_name}
              onChange={(value) => setUserInfo((prev) => ({ ...prev, last_name: value }))}
              required
            />
            <TextInput
              label="Phone"
              value={userInfo.phone}
              onChange={(value) => setUserInfo((prev) => ({ ...prev, phone: value }))}
            />
            <TextInput
              label="Emergency contact"
              value={userInfo.emergency_contact}
              onChange={(value) => setUserInfo((prev) => ({ ...prev, emergency_contact: value }))}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Health profile</h2>
            <button
              onClick={handleSaveHealthProfile}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
              disabled={savingHealth}
            >
              {savingHealth ? "Saving..." : "Save"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Date of birth"
              type="date"
              value={healthInfo.date_of_birth}
              onChange={(value) => setHealthInfo((prev) => ({ ...prev, date_of_birth: value }))}
            />
            <TextInput
              label="Gender"
              value={healthInfo.gender}
              onChange={(value) => setHealthInfo((prev) => ({ ...prev, gender: value }))}
              placeholder="e.g. Female"
            />
            <TextInput
              label="Blood type"
              value={healthInfo.blood_type}
              onChange={(value) => setHealthInfo((prev) => ({ ...prev, blood_type: value.toUpperCase() }))}
              placeholder="e.g. O+"
            />
            <TextInput
              label="Height (cm)"
              type="number"
              value={healthInfo.height_cm}
              onChange={(value) => setHealthInfo((prev) => ({ ...prev, height_cm: value }))}
              min="0"
            />
            <TextInput
              label="Weight (kg)"
              type="number"
              value={healthInfo.weight_kg}
              onChange={(value) => setHealthInfo((prev) => ({ ...prev, weight_kg: value }))}
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio / wellness notes</label>
            <textarea
              value={healthInfo.bio}
              onChange={(e) => setHealthInfo((prev) => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="Share your health preferences, goals, or active care plans."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Medical conditions</h2>
            {conditions.length === 0 ? (
              <p className="text-sm text-gray-500">Add chronic or recurring conditions you want to track.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {conditions.map((condition, index) => (
                  <span
                    key={`${condition.condition_name}-${index}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-sm"
                  >
                    {condition.condition_name}
                    <span className="text-xs capitalize text-blue-600">{condition.status.replace("_", " ")}</span>
                    <button
                      className="text-blue-700 hover:text-blue-900"
                      onClick={() => handleRemoveCondition(index)}
                      aria-label="Remove condition"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextInput
                label="Condition name"
                value={newCondition.condition_name}
                onChange={(value) => setNewCondition((prev) => ({ ...prev, condition_name: value }))}
                placeholder="e.g. Type 2 diabetes"
              />
              <SelectInput
                label="Status"
                value={newCondition.status}
                options={CONDITION_STATUS_OPTIONS}
                onChange={(value) => setNewCondition((prev) => ({ ...prev, status: value as PatientConditionStatus }))}
              />
            </div>
            <button
              onClick={handleAddCondition}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition"
            >
              Add condition
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Diagnosed diseases</h2>
            {diagnoses.length === 0 ? (
              <p className="text-sm text-gray-500">Document diagnosed diseases (active or resolved).</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {diagnoses.map((diagnosis, index) => (
                  <span
                    key={`${diagnosis.disease_name}-${index}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-sm"
                  >
                    {diagnosis.disease_name}
                    <span className="text-xs capitalize text-purple-600">
                      {diagnosis.status.replace("_", " ")}
                    </span>
                    <button
                      className="text-purple-700 hover:text-purple-900"
                      onClick={() => handleRemoveDiagnosis(index)}
                      aria-label="Remove diagnosis"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextInput
                label="Disease name"
                value={newDiagnosis.disease_name}
                onChange={(value) => setNewDiagnosis((prev) => ({ ...prev, disease_name: value }))}
                placeholder="e.g. Hypertension"
              />
              <SelectInput
                label="Status"
                value={newDiagnosis.status}
                options={DIAGNOSIS_STATUS_OPTIONS}
                onChange={(value) =>
                  setNewDiagnosis((prev) => ({ ...prev, status: value as PatientDiagnosisStatus }))
                }
              />
            </div>
            <button
              onClick={handleAddDiagnosis}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition"
            >
              Add disease
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </option>
        ))}
      </select>
    </div>
  );
}

function Alert({ type, message }: { type: "success" | "error"; message: string }) {
  const palette =
    type === "success"
      ? "bg-green-50 border-green-200 text-green-800"
      : "bg-red-50 border-red-200 text-red-800";
  return (
    <div className={`border rounded-2xl px-4 py-3 text-sm ${palette}`}>
      {message}
    </div>
  );
}

