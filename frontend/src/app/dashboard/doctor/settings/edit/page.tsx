"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  doctorAPI,
  DoctorProfileData,
  DoctorProfileUpdate,
  UserInfoUpdate,
  DoctorSocialLink,
  DoctorSocialLinkCreatePayload,
  DoctorSocialLinkUpdatePayload,
  authAPI,
  Address,
} from "@/services/api";
import { APIError } from "@/services/api";
import { formatSpecialty } from "@/utils/formatSpecialty";

const SOCIAL_PLATFORM_OPTIONS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X (Twitter)" },
  { value: "youtube", label: "YouTube" },
  { value: "doximity", label: "Doximity" },
  { value: "researchgate", label: "ResearchGate" },
  { value: "custom", label: "Custom" },
];

type SocialLinkFormState = {
  platform: string;
  url: string;
  display_label: string;
  is_visible: boolean;
  display_order: string;
};

export default function SettingsPage() {
  const { user, setUser } = useAuth();
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
    years_of_experience: "",
    medical_license_number: "",
    board_certifications: [] as string[],
    languages_spoken: [] as string[],
    accepting_new_patients: false,
    offers_virtual_visits: false,
  });

  const [specialtyOptions, setSpecialtyOptions] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  
  // Profile picture upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoVersion, setPhotoVersion] = useState(0); // For cache-busting
  const [lastUploadedPhotoUrl, setLastUploadedPhotoUrl] = useState<string | null>(null); // Track last uploaded photo

  // Cover photo state
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [coverPhotoVersion, setCoverPhotoVersion] = useState(0);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [deletingCover, setDeletingCover] = useState(false);

  // Social links state
  const [socialLinks, setSocialLinks] = useState<DoctorSocialLink[]>([]);
  const [editingSocialLinkId, setEditingSocialLinkId] = useState<number | null>(null);
  const [socialLinkDraft, setSocialLinkDraft] = useState<SocialLinkFormState | null>(null);
  const [newSocialLink, setNewSocialLink] = useState<SocialLinkFormState>({
    platform: "",
    url: "",
    display_label: "",
    is_visible: true,
    display_order: "",
  });
  const [creatingSocialLink, setCreatingSocialLink] = useState(false);
  const [updatingSocialLink, setUpdatingSocialLink] = useState(false);
  const [deletingSocialLinkId, setDeletingSocialLinkId] = useState<number | null>(null);
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<number | null>(null);

  // Address form state (shared with patient settings API)
  const [address, setAddress] = useState<{
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    country_code: string;
    label: string;
  }>({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country_code: "US",
    label: "Primary Clinic",
  });

  useEffect(() => {
    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadAddress = async () => {
      try {
        const existing = await authAPI.getAddress();
        if (existing) {
          setAddress({
            address_line1: existing.address_line1,
            address_line2: existing.address_line2 ?? "",
            city: existing.city,
            state: existing.state ?? "",
            postal_code: existing.postal_code ?? "",
            country_code: existing.country_code ?? "US",
            label: existing.label ?? "Primary Clinic",
          });
        }
      } catch {
        // Address is optional; ignore errors here
      }
    };
    loadAddress();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchSpecialties = async () => {
      try {
        const specialties = await doctorAPI.listSpecialties();
        if (!isMounted) return;
        setSpecialtyOptions(
          specialties
            .map((value) => value?.trim())
            .filter((value): value is string => Boolean(value))
        );
      } catch {
        // Ignore, suggestions are optional
      }
    };

    fetchSpecialties();

    return () => {
      isMounted = false;
    };
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

  const syncProfileState = useCallback((data: DoctorProfileData) => {
    setProfileData(data);

    setUserInfo({
      first_name: data.user.first_name || user?.first_name || "",
      middle_name: data.user.middle_name || "",
      last_name: data.user.last_name || user?.last_name || "",
      phone: data.user.phone || user?.phone || "",
      emergency_contact: data.user.emergency_contact || "",
    });

    const profile = data.profile;
    const updatedProfileInfo = {
      specialty: profile?.specialty || "",
      bio: profile?.bio || "",
      years_of_experience: profile?.years_of_experience?.toString() || "",
      medical_license_number: profile?.medical_license_number || "",
      board_certifications: profile?.board_certifications || [],
      languages_spoken: profile?.languages_spoken || [],
      accepting_new_patients: profile?.accepting_new_patients ?? false,
      offers_virtual_visits: profile?.offers_virtual_visits ?? false,
    };
    setProfileInfo(updatedProfileInfo);

    if (profile?.specialty) {
      setSpecialtyOptions((prev) => {
        if (prev.includes(profile.specialty)) {
          return prev;
        }
        return [...prev, profile.specialty];
      });
    }

    setLastUploadedPhotoUrl(profile?.photo_url || null);
    setCoverPhotoUrl(profile?.cover_photo_url || null);
    setSocialLinks(data.social_links || []);
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorAPI.getProfile();
      syncProfileState(data);
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
      syncProfileState(updated);
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
      accepting_new_patients: profileInfo.accepting_new_patients,
      offers_virtual_visits: profileInfo.offers_virtual_visits,
      };

      const updated = await doctorAPI.updateProfile(updateData);
      syncProfileState(updated);
      
      // Update profile info state
      if (updated.profile) {
        setProfileInfo({
          specialty: updated.profile.specialty || "",
          bio: updated.profile.bio || "",
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

  const handleSaveAddress = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        address_line1: address.address_line1.trim(),
        address_line2: address.address_line2.trim() || undefined,
        city: address.city.trim(),
        state: address.state.trim() || undefined,
        postal_code: address.postal_code.trim() || undefined,
        country_code: address.country_code.trim() || undefined,
        label: address.label.trim() || undefined,
      };

      const updated = await authAPI.upsertAddress(payload);

      // Normalize state from server response
      setAddress({
        address_line1: updated.address_line1,
        address_line2: updated.address_line2 ?? "",
        city: updated.city,
        state: updated.state ?? "",
        postal_code: updated.postal_code ?? "",
        country_code: updated.country_code ?? "",
        label: updated.label ?? "Primary Clinic",
      });

      setSuccess("Address updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to update address");
      } else {
        setError("An unexpected error occurred while updating the address");
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    try {
      setUploadingPhoto(true);
      setError(null);
      setSuccess(null);

      const response = await doctorAPI.uploadProfilePicture(file);
      
      // Store the uploaded photo URL immediately
      setLastUploadedPhotoUrl(response.photo_url);
      
      // Reload profile data to get updated photo URL
      await loadProfileData();
      
      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Increment photo version to force image refresh
      setPhotoVersion(prev => prev + 1);
      
      // Update user context with new photo URL (for header display)
      if (user && response.photo_url) {
        // Store base URL without cache-busting params
        setUser({ ...user, photo_url: response.photo_url });
      }
      
      setSuccess("Profile picture uploaded successfully!");
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to upload profile picture");
      } else {
        setError("An unexpected error occurred while uploading the picture");
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!confirm("Are you sure you want to delete your profile picture?")) {
      return;
    }

    try {
      setDeletingPhoto(true);
      setError(null);
      setSuccess(null);

      await doctorAPI.deleteProfilePicture();
      
      // Optimistically clear profile photo from cached data
      setProfileData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profile: prev.profile
            ? { ...prev.profile, photo_url: null }
            : prev.profile,
        };
      });
      
      // Clear the last uploaded photo URL
      setLastUploadedPhotoUrl(null);
      
      // Reload profile data
      await loadProfileData();
      
      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Increment photo version to force image refresh
      setPhotoVersion(prev => prev + 1);
      
      // Update user context to remove photo URL
      if (user) {
        setUser({ ...user, photo_url: undefined });
      }
      
      setSuccess("Profile picture deleted successfully!");
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to delete profile picture");
      } else {
        setError("An unexpected error occurred while deleting the picture");
      }
    } finally {
      setDeletingPhoto(false);
    }
  };

  const displayPhotoUrl =
    lastUploadedPhotoUrl ??
    profileData?.profile?.photo_url ??
    null;

  const hasProfilePhoto = Boolean(displayPhotoUrl);

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("File size exceeds 8MB limit.");
      return;
    }

    try {
      setUploadingCover(true);
      setError(null);
      setSuccess(null);

      const response = await doctorAPI.uploadCoverPhoto(file);
      setCoverPhotoUrl(response.cover_photo_url);
      await loadProfileData();
      await new Promise((resolve) => setTimeout(resolve, 100));
      setCoverPhotoVersion((prev) => prev + 1);

      setSuccess("Cover photo uploaded successfully!");
      setTimeout(() => setSuccess(null), 3000);

      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = "";
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to upload cover photo");
      } else {
        setError("An unexpected error occurred while uploading the cover photo");
      }
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCoverDelete = async () => {
    if (!confirm("Are you sure you want to delete your cover photo?")) {
      return;
    }

    try {
      setDeletingCover(true);
      setError(null);
      setSuccess(null);

      await doctorAPI.deleteCoverPhoto();
      setCoverPhotoUrl(null);
      await loadProfileData();
      await new Promise((resolve) => setTimeout(resolve, 100));
      setCoverPhotoVersion((prev) => prev + 1);

      setSuccess("Cover photo deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to delete cover photo");
      } else {
        setError("An unexpected error occurred while deleting the cover photo");
      }
    } finally {
      setDeletingCover(false);
    }
  };

  const startEditingSocialLink = (link: DoctorSocialLink) => {
    setEditingSocialLinkId(link.id);
    setSocialLinkDraft({
      platform: link.platform || "",
      url: link.url || "",
      display_label: link.display_label || "",
      is_visible: link.is_visible,
      display_order: link.display_order != null ? String(link.display_order) : "",
    });
  };

  const cancelEditingSocialLink = () => {
    setEditingSocialLinkId(null);
    setSocialLinkDraft(null);
  };

  const handleSaveSocialLink = async () => {
    if (editingSocialLinkId == null || !socialLinkDraft) {
      return;
    }

    const trimmedPlatform = socialLinkDraft.platform.trim();
    const trimmedUrl = socialLinkDraft.url.trim();
    if (!trimmedPlatform || !trimmedUrl) {
      setError("Platform and URL are required.");
      return;
    }

    const displayOrderValue = socialLinkDraft.display_order.trim();
    let displayOrderNumber: number | undefined;
    if (displayOrderValue) {
      const parsed = Number(displayOrderValue);
      if (Number.isNaN(parsed)) {
        setError("Display order must be a number.");
        return;
      }
      displayOrderNumber = parsed;
    }

    const payload: DoctorSocialLinkUpdatePayload = {
      platform: trimmedPlatform,
      url: trimmedUrl,
      display_label: socialLinkDraft.display_label.trim() || undefined,
      is_visible: socialLinkDraft.is_visible,
      display_order: displayOrderNumber,
    };

    try {
      setUpdatingSocialLink(true);
      setError(null);
      setSuccess(null);

      const updatedLink = await doctorAPI.updateSocialLink(editingSocialLinkId, payload);

      setSocialLinks((prev) =>
        prev.map((link) => (link.id === updatedLink.id ? updatedLink : link))
      );
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              social_links: (prev.social_links ?? []).map((link) =>
                link.id === updatedLink.id ? updatedLink : link
              ),
            }
          : prev
      );

      setSuccess("Social link updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      cancelEditingSocialLink();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to update social link");
      } else {
        setError("An unexpected error occurred while updating the social link");
      }
    } finally {
      setUpdatingSocialLink(false);
    }
  };

  const handleCreateSocialLink = async () => {
    const trimmedPlatform = newSocialLink.platform.trim();
    const trimmedUrl = newSocialLink.url.trim();
    if (!trimmedPlatform || !trimmedUrl) {
      setError("Platform and URL are required.");
      return;
    }

    const displayOrderValue = newSocialLink.display_order.trim();
    let displayOrderNumber: number | undefined;
    if (displayOrderValue) {
      const parsed = Number(displayOrderValue);
      if (Number.isNaN(parsed)) {
        setError("Display order must be a number.");
        return;
      }
      displayOrderNumber = parsed;
    }

    const payload: DoctorSocialLinkCreatePayload = {
      platform: trimmedPlatform,
      url: trimmedUrl,
      display_label: newSocialLink.display_label.trim() || undefined,
      is_visible: newSocialLink.is_visible,
      display_order: displayOrderNumber,
    };

    try {
      setCreatingSocialLink(true);
      setError(null);
      setSuccess(null);

      const createdLink = await doctorAPI.createSocialLink(payload);
      setSocialLinks((prev) => [...prev, createdLink]);
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              social_links: [...(prev.social_links ?? []), createdLink],
            }
          : prev
      );

      setNewSocialLink({
        platform: "",
        url: "",
        display_label: "",
        is_visible: true,
        display_order: "",
      });

      setSuccess("Social link added successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to create social link");
      } else {
        setError("An unexpected error occurred while creating the social link");
      }
    } finally {
      setCreatingSocialLink(false);
    }
  };

  const handleDeleteSocialLink = async (linkId: number) => {
    if (!confirm("Delete this social link?")) {
      return;
    }

    try {
      setDeletingSocialLinkId(linkId);
      setError(null);
      setSuccess(null);

      await doctorAPI.deleteSocialLink(linkId);
      setSocialLinks((prev) => prev.filter((link) => link.id !== linkId));
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              social_links: (prev.social_links ?? []).filter((link) => link.id !== linkId),
            }
          : prev
      );

      setSuccess("Social link deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to delete social link");
      } else {
        setError("An unexpected error occurred while deleting the social link");
      }
    } finally {
      setDeletingSocialLinkId(null);
    }
  };

  const handleToggleSocialLinkVisibility = async (link: DoctorSocialLink) => {
    try {
      setTogglingVisibilityId(link.id);
      setError(null);
      setSuccess(null);

      const updatedLink = await doctorAPI.updateSocialLink(link.id, {
        is_visible: !link.is_visible,
      });

      setSocialLinks((prev) =>
        prev.map((item) => (item.id === updatedLink.id ? updatedLink : item))
      );
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              social_links: (prev.social_links ?? []).map((item) =>
                item.id === updatedLink.id ? updatedLink : item
              ),
            }
          : prev
      );

      setSuccess(
        updatedLink.is_visible
          ? "Social link will now display on your profile."
          : "Social link is hidden from your profile."
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.detail || "Failed to update social link visibility");
      } else {
        setError("An unexpected error occurred while updating visibility");
      }
    } finally {
      setTogglingVisibilityId(null);
    }
  };

  const coverDisplayUrl =
    coverPhotoUrl ??
    profileData?.profile?.cover_photo_url ??
    null;

  const hasCoverPhoto = Boolean(coverDisplayUrl);

  const specialtyChoices = useMemo(() => {
    const unique = new Set(
      specialtyOptions
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    );

    const current = profileInfo.specialty.trim();
    if (current.length > 0) {
      unique.add(current);
    }

    return Array.from(unique).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [specialtyOptions, profileInfo.specialty]);

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

        {/* Social Links Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Social Presence</h2>
                <p className="text-gray-600">
                  Add links to your professional social profiles and choose whether to display them publicly.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {socialLinks.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                  No social links added yet. Use the form below to add your first link.
                </div>
              ) : (
                [...socialLinks]
                  .sort((a, b) => {
                    const orderA = a.display_order ?? 9999;
                    const orderB = b.display_order ?? 9999;
                    if (orderA !== orderB) return orderA - orderB;
                    return a.id - b.id;
                  })
                  .map((link) => {
                    const isEditing = editingSocialLinkId === link.id && socialLinkDraft;
                    return (
                      <div
                        key={link.id}
                        className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
                      >
                        {isEditing ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Platform *
                                </label>
                                <input
                                  list="social-platforms"
                                  value={socialLinkDraft.platform}
                                  onChange={(e) =>
                                    setSocialLinkDraft({
                                      ...socialLinkDraft,
                                      platform: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                  placeholder="LinkedIn, Instagram, etc."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Display Label
                                </label>
                                <input
                                  type="text"
                                  value={socialLinkDraft.display_label}
                                  onChange={(e) =>
                                    setSocialLinkDraft({
                                      ...socialLinkDraft,
                                      display_label: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                  placeholder="Optional label"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  URL *
                                </label>
                                <input
                                  type="url"
                                  value={socialLinkDraft.url}
                                  onChange={(e) =>
                                    setSocialLinkDraft({
                                      ...socialLinkDraft,
                                      url: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                  placeholder="https://example.com/profile"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Display Order
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={socialLinkDraft.display_order}
                                  onChange={(e) =>
                                    setSocialLinkDraft({
                                      ...socialLinkDraft,
                                      display_order: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                  placeholder="Optional"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={socialLinkDraft.is_visible}
                                  onChange={(e) =>
                                    setSocialLinkDraft({
                                      ...socialLinkDraft,
                                      is_visible: e.target.checked,
                                    })
                                  }
                                  className="h-4 w-4 border-gray-300 rounded"
                                  id={`social-visible-${link.id}`}
                                />
                                <label
                                  htmlFor={`social-visible-${link.id}`}
                                  className="text-sm text-gray-700"
                                >
                                  Display on public profile
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={handleSaveSocialLink}
                                disabled={updatingSocialLink}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                              >
                                {updatingSocialLink ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={cancelEditingSocialLink}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                    {link.display_label || link.platform}
                                  </h3>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      link.is_visible
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {link.is_visible ? "Visible" : "Hidden"}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                  Platform: {link.platform}
                                  {link.display_order != null
                                    ? ` • Order: ${link.display_order}`
                                    : ""}
                                </p>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 text-sm break-all"
                                >
                                  {link.url}
                                </a>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => startEditingSocialLink(link)}
                                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleSocialLinkVisibility(link)}
                                  disabled={togglingVisibilityId === link.id}
                                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition disabled:opacity-50"
                                >
                                  {togglingVisibilityId === link.id
                                    ? "Updating..."
                                    : link.is_visible
                                      ? "Hide"
                                      : "Show"}
                                </button>
                                <button
                                  onClick={() => handleDeleteSocialLink(link.id)}
                                  disabled={deletingSocialLinkId === link.id}
                                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                                >
                                  {deletingSocialLinkId === link.id ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Add new link</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform *
                  </label>
                  <input
                    list="social-platforms"
                    value={newSocialLink.platform}
                    onChange={(e) =>
                      setNewSocialLink({ ...newSocialLink, platform: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="LinkedIn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Label
                  </label>
                  <input
                    type="text"
                    value={newSocialLink.display_label}
                    onChange={(e) =>
                      setNewSocialLink({ ...newSocialLink, display_label: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Optional label"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <input
                    type="url"
                    value={newSocialLink.url}
                    onChange={(e) =>
                      setNewSocialLink({ ...newSocialLink, url: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newSocialLink.display_order}
                    onChange={(e) =>
                      setNewSocialLink({ ...newSocialLink, display_order: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Optional"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSocialLink.is_visible}
                    onChange={(e) =>
                      setNewSocialLink({ ...newSocialLink, is_visible: e.target.checked })
                    }
                    className="h-4 w-4 border-gray-300 rounded"
                    id="new-social-visible"
                  />
                  <label htmlFor="new-social-visible" className="text-sm text-gray-700">
                    Display on public profile
                  </label>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleCreateSocialLink}
                  disabled={creatingSocialLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {creatingSocialLink ? "Adding..." : "Add Link"}
                </button>
              </div>
            </div>
          </div>

          <datalist id="social-platforms">
            {SOCIAL_PLATFORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} label={option.label} />
            ))}
          </datalist>
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

        {/* Profile Picture Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Picture</h2>
          
          <div className="flex items-start gap-6">
            {/* Current Picture */}
            <div className="flex-shrink-0 relative">
              {hasProfilePhoto ? (
                <>
                  <img
                    key={`photo-${photoVersion}-${displayPhotoUrl}`}
                    src={`${displayPhotoUrl}?v=${photoVersion}&t=${Date.now()}`}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    onError={(e) => {
                      // Hide image if it fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    onLoad={(e) => {
                      // Show image when it loads successfully
                      (e.target as HTMLImageElement).style.display = 'block';
                    }}
                  />
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300 absolute top-0 left-0 -z-10">
                    <span className="text-gray-400 text-4xl font-semibold">
                      {profileData?.user?.first_name?.[0]?.toUpperCase() || "D"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                  <span className="text-gray-400 text-4xl font-semibold">
                    {profileData?.user?.first_name?.[0]?.toUpperCase() || "D"}
                  </span>
                </div>
              )}
            </div>

            {/* Upload/Delete Controls */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Profile Picture
                </label>
                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer inline-block ${
                      uploadingPhoto ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {uploadingPhoto 
                      ? "Uploading..." 
                      : hasProfilePhoto
                        ? "Update Picture" 
                        : "Choose File"}
                  </label>
                  
                  {hasProfilePhoto && (
                    <button
                      onClick={handlePhotoDelete}
                      disabled={deletingPhoto}
                      className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition ${
                        deletingPhoto ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {deletingPhoto ? "Deleting..." : "Delete Picture"}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: JPEG, PNG, WebP. Max size: 5MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cover Photo Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Cover Photo</h2>
              <p className="text-gray-600 mb-4">
                Upload a banner image that appears at the top of your public profile.
              </p>

              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 overflow-hidden">
                {hasCoverPhoto ? (
                  <img
                    key={`cover-${coverPhotoVersion}-${coverDisplayUrl}`}
                    src={`${coverDisplayUrl}?v=${coverPhotoVersion}&t=${Date.now()}`}
                    alt="Cover"
                    className="w-full h-48 md:h-56 lg:h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 md:h-56 lg:h-64 flex flex-col items-center justify-center text-gray-400">
                    <span className="text-3xl mb-2">🖼️</span>
                    <span className="text-sm">No cover photo uploaded</span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-64 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Cover Photo
                </label>
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                  id="cover-upload"
                />
                <label
                  htmlFor="cover-upload"
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer inline-block ${
                    uploadingCover ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {uploadingCover
                    ? "Uploading..."
                    : hasCoverPhoto
                      ? "Update Cover"
                      : "Choose File"}
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended size: 1600 × 400px. Max size: 8MB. Formats: JPEG, PNG, WebP.
                </p>
              </div>

              {hasCoverPhoto && (
                <button
                  onClick={handleCoverDelete}
                  disabled={deletingCover}
                  className={`w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition ${
                    deletingCover ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {deletingCover ? "Deleting..." : "Remove Cover"}
                </button>
              )}
            </div>
          </div>
        </div>

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

        {/* Address Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Primary Address</h2>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={address.address_line1}
                  onChange={(e) =>
                    setAddress({ ...address, address_line1: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Street address line 1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={address.address_line2}
                  onChange={(e) =>
                    setAddress({ ...address, address_line2: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State / Region
                </label>
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="State or region"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  value={address.postal_code}
                  onChange={(e) =>
                    setAddress({ ...address, postal_code: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Postal or ZIP code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country Code
                </label>
                <input
                  type="text"
                  value={address.country_code}
                  maxLength={2}
                  onChange={(e) =>
                    setAddress({
                      ...address,
                      country_code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="e.g. US"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={address.label}
                  onChange={(e) =>
                    setAddress({ ...address, label: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Primary Clinic, Home, etc."
                />
              </div>
              <button
                onClick={handleSaveAddress}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "Saving Address..." : "Save Address"}
              </button>
            </div>
          </div>
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
                <input
                  list="doctor-specialties"
                  value={profileInfo.specialty}
                  onChange={(e) =>
                    setProfileInfo({ ...profileInfo, specialty: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Select or type your specialty"
                  required
                />
                <datalist id="doctor-specialties">
                  {specialtyChoices.map((specialty) => (
                    <option
                      key={specialty}
                      value={specialty}
                      label={formatSpecialty(specialty)}
                    />
                  ))}
                </datalist>
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
                    value={displayPhotoUrl ?? ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    placeholder="No profile photo uploaded"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Practice Availability
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={profileInfo.accepting_new_patients}
                      onChange={(e) =>
                        setProfileInfo({
                          ...profileInfo,
                          accepting_new_patients: e.target.checked,
                        })
                      }
                      className="h-4 w-4 border-gray-300 rounded"
                    />
                    <span>Accepting new patients</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={profileInfo.offers_virtual_visits}
                      onChange={(e) =>
                        setProfileInfo({
                          ...profileInfo,
                          offers_virtual_visits: e.target.checked,
                        })
                      }
                      className="h-4 w-4 border-gray-300 rounded"
                    />
                    <span>Offers virtual visits</span>
                  </label>
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
                  {formatSpecialty(profileData?.profile?.specialty) || "—"}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Practice Availability
                </label>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      profileData?.profile?.accepting_new_patients
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {profileData?.profile?.accepting_new_patients
                      ? "Accepting new patients"
                      : "Not accepting new patients"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      profileData?.profile?.offers_virtual_visits
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {profileData?.profile?.offers_virtual_visits
                      ? "Offers virtual visits"
                      : "No virtual visits"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
