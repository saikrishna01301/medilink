"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doctorAPI, DoctorProfileData, DoctorProfileUpdate, UserInfoUpdate } from "@/services/api";
import { APIError } from "@/services/api";
import { MEDICAL_SPECIALTIES } from "@/utils/medicalSpecialties";

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<DoctorProfileData | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // User info form state
  const [userInfo, setUserInfo] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone: "",
    emergency_contact: "",
  });

  // Profile form state
  const [profileInfo, setProfileInfo] = useState({
    specialty: "",
    bio: "",
    photo_url: "",
    years_of_experience: "",
    medical_license_number: "",
    board_certifications: [] as string[],
    languages_spoken: [] as string[],
  });

  // Form field states for dynamic arrays
  const [newCertification, setNewCertification] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  useEffect(() => {
    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Populate user info from auth context as initial fallback
  useEffect(() => {
    if (user && !profileData) {
      setUserInfo({
        first_name: user.first_name || "",
        middle_name: "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        emergency_contact: "",
      });
    }
  }, [user, profileData]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorAPI.getProfile();
      setProfileData(data);

      // Populate user info - use auth context user as fallback
      setUserInfo({
        first_name: data.user.first_name || user?.first_name || "",
        middle_name: data.user.middle_name || "",
        last_name: data.user.last_name || user?.last_name || "",
        phone: data.user.phone || user?.phone || "",
        emergency_contact: data.user.emergency_contact || "",
      });

      // Populate profile info
      if (data.profile) {
        setProfileInfo({
          specialty: data.profile.specialty || "",
          bio: data.profile.bio || "",
          photo_url: data.profile.photo_url || "",
          years_of_experience: data.profile.years_of_experience?.toString() || "",
          medical_license_number: data.profile.medical_license_number || "",
          board_certifications: data.profile.board_certifications || [],
          languages_spoken: data.profile.languages_spoken || [],
        });
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to load profile data");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUserInfo = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData: UserInfoUpdate = {
        first_name: userInfo.first_name,
        middle_name: userInfo.middle_name || undefined,
        last_name: userInfo.last_name,
        phone: userInfo.phone,
        emergency_contact: userInfo.emergency_contact || undefined,
      };

      const updated = await doctorAPI.updateUserInfo(updateData);
      setProfileData(updated);
      setEditingSection(null);
      setSuccess("User information updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to update user information");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData: DoctorProfileUpdate = {
        specialty: profileInfo.specialty,
        bio: profileInfo.bio || undefined,
        photo_url: profileInfo.photo_url || undefined,
        years_of_experience: profileInfo.years_of_experience
          ? parseInt(profileInfo.years_of_experience)
          : undefined,
        medical_license_number: profileInfo.medical_license_number || undefined,
        board_certifications: profileInfo.board_certifications.length > 0
          ? profileInfo.board_certifications
          : undefined,
        languages_spoken: profileInfo.languages_spoken.length > 0
          ? profileInfo.languages_spoken
          : undefined,
      };

      const updated = await doctorAPI.updateProfile(updateData);
      setProfileData(updated);
      
      // Update profile info state
      if (updated.profile) {
        setProfileInfo({
          specialty: updated.profile.specialty || "",
          bio: updated.profile.bio || "",
          photo_url: updated.profile.photo_url || "",
          years_of_experience: updated.profile.years_of_experience?.toString() || "",
          medical_license_number: updated.profile.medical_license_number || "",
          board_certifications: updated.profile.board_certifications || [],
          languages_spoken: updated.profile.languages_spoken || [],
        });
      }
      
      setEditingSection(null);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to update profile");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setProfileInfo({
        ...profileInfo,
        board_certifications: [...profileInfo.board_certifications, newCertification.trim()],
      });
      setNewCertification("");
    }
  };

  const removeCertification = (index: number) => {
    setProfileInfo({
      ...profileInfo,
      board_certifications: profileInfo.board_certifications.filter((_, i) => i !== index),
    });
  };

  const addLanguage = () => {
    if (newLanguage.trim()) {
      setProfileInfo({
        ...profileInfo,
        languages_spoken: [...profileInfo.languages_spoken, newLanguage.trim()],
      });
      setNewLanguage("");
    }
  };

  const removeLanguage = (index: number) => {
    setProfileInfo({
      ...profileInfo,
      languages_spoken: profileInfo.languages_spoken.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <main className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: "#ECF4F9" }}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-600">Loading profile data...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: "#ECF4F9" }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your account information and profile details</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* User Information Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            {editingSection !== "user" && (
              <button
                onClick={() => setEditingSection("user")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Edit
              </button>
            )}
          </div>

          {editingSection === "user" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={userInfo.first_name}
                    onChange={(e) => setUserInfo({ ...userInfo, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={userInfo.middle_name}
                    onChange={(e) => setUserInfo({ ...userInfo, middle_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={userInfo.last_name}
                    onChange={(e) => setUserInfo({ ...userInfo, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData?.user.email || ""}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="tel"
                    value={userInfo.emergency_contact}
                    onChange={(e) =>
                      setUserInfo({ ...userInfo, emergency_contact: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveUserInfo}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditingSection(null);
                    loadProfileData(); // Reset form
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <p className="text-gray-900 text-base py-2">
                  {profileData?.user.first_name || user?.first_name || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <p className="text-gray-900 text-base py-2">
                  {profileData?.user.middle_name || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <p className="text-gray-900 text-base py-2">
                  {profileData?.user.last_name || user?.last_name || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 text-base py-2">
                  {profileData?.user.email || user?.email || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900 text-base py-2">
                  {profileData?.user.phone || user?.phone || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact
                </label>
                <p className="text-gray-900 text-base py-2">
                  {profileData?.user.emergency_contact || "—"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Professional Profile Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Professional Profile</h2>
            {editingSection !== "profile" && (
              <button
                onClick={() => setEditingSection("profile")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Edit
              </button>
            )}
          </div>

          {editingSection === "profile" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialty *
                </label>
                <select
                  value={profileInfo.specialty}
                  onChange={(e) =>
                    setProfileInfo({ ...profileInfo, specialty: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                >
                  <option value="">Select a specialty</option>
                  {MEDICAL_SPECIALTIES.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={profileInfo.bio}
                  onChange={(e) => setProfileInfo({ ...profileInfo, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    value={profileInfo.photo_url}
                    onChange={(e) =>
                      setProfileInfo({ ...profileInfo, photo_url: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={profileInfo.years_of_experience}
                    onChange={(e) =>
                      setProfileInfo({ ...profileInfo, years_of_experience: e.target.value })
                    }
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical License Number
                </label>
                <input
                  type="text"
                  value={profileInfo.medical_license_number}
                  onChange={(e) =>
                    setProfileInfo({ ...profileInfo, medical_license_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Board Certifications
                </label>
                <div className="space-y-2">
                  {profileInfo.board_certifications.map((cert, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cert}
                        onChange={(e) => {
                          const updated = [...profileInfo.board_certifications];
                          updated[index] = e.target.value;
                          setProfileInfo({ ...profileInfo, board_certifications: updated });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      />
                      <button
                        onClick={() => removeCertification(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addCertification()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Add certification"
                    />
                    <button
                      onClick={addCertification}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages Spoken
                </label>
                <div className="space-y-2">
                  {profileInfo.languages_spoken.map((lang, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={lang}
                        onChange={(e) => {
                          const updated = [...profileInfo.languages_spoken];
                          updated[index] = e.target.value;
                          setProfileInfo({ ...profileInfo, languages_spoken: updated });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      />
                      <button
                        onClick={() => removeLanguage(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addLanguage()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Add language"
                    />
                    <button
                      onClick={addLanguage}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditingSection(null);
                    loadProfileData(); // Reset form
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <p className="text-gray-900 text-base py-2">
                  {profileData?.profile?.specialty || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <p className="text-gray-900 whitespace-pre-wrap text-base py-2 min-h-[60px]">
                  {profileData?.profile?.bio || "—"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <p className="text-gray-900 text-base py-2">
                    {profileData?.profile?.years_of_experience 
                      ? `${profileData.profile.years_of_experience} ${profileData.profile.years_of_experience === 1 ? 'year' : 'years'}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical License Number
                  </label>
                  <p className="text-gray-900 text-base py-2">
                    {profileData?.profile?.medical_license_number || "—"}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Board Certifications
                </label>
                <div className="flex flex-wrap gap-2">
                  {profileData?.profile?.board_certifications &&
                  profileData.profile.board_certifications.length > 0 ? (
                    profileData.profile.board_certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {cert}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No certifications added</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Languages Spoken
                </label>
                <div className="flex flex-wrap gap-2">
                  {profileData?.profile?.languages_spoken &&
                  profileData.profile.languages_spoken.length > 0 ? (
                    profileData.profile.languages_spoken.map((lang, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {lang}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No languages added</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
