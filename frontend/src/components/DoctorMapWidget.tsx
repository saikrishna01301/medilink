"use client";

import { useEffect, useRef, useState } from "react";
import { DoctorListItem } from "@/services/api";

interface DoctorMapWidgetProps {
  doctors: DoctorListItem[];
  patientLatitude?: number | null;
  patientLongitude?: number | null;
  onDoctorClick?: (doctor: DoctorListItem) => void;
}

declare global {
  interface Window {
    google: any;
    googleMapsScriptLoaded?: boolean;
  }
}

// Global promise to track script loading
let googleMapsLoadPromise: Promise<void> | null = null;

export default function DoctorMapWidget({
  doctors,
  patientLatitude,
  patientLongitude,
  onDoctorClick,
}: DoctorMapWidgetProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowsRef = useRef<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Load Google Maps script only once globally
  const loadGoogleMapsScript = (): Promise<void> => {
    // If already loaded, return resolved promise
    if (window.google && window.google.maps) {
      return Promise.resolve();
    }

    // If script is already loading, return the existing promise
    if (googleMapsLoadPromise) {
      return googleMapsLoadPromise;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      // Script exists but might not be loaded yet, wait for it
      googleMapsLoadPromise = new Promise((resolve) => {
        const checkGoogle = () => {
          if (window.google && window.google.maps) {
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
      });
      return googleMapsLoadPromise;
    }

    // Create new script loading promise
    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.id = "google-maps-script";
      script.onload = () => {
        window.googleMapsScriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        googleMapsLoadPromise = null;
        reject(new Error("Failed to load Google Maps script"));
      };
      document.head.appendChild(script);
    });

    return googleMapsLoadPromise;
  };

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    const initializeMap = () => {
      if (!mapRef.current || !window.google?.maps) return;

      const doctorsWithLocation = doctors.filter(
        (d) => d.latitude && d.longitude
      );

      if (doctorsWithLocation.length === 0 && !patientLatitude && !patientLongitude) {
        return;
      }

      // Calculate center
      let centerLat = 0;
      let centerLng = 0;
      let count = 0;

      if (patientLatitude && patientLongitude) {
        centerLat = patientLatitude;
        centerLng = patientLongitude;
        count = 1;
      }

      doctorsWithLocation.forEach((doctor) => {
        if (doctor.latitude && doctor.longitude) {
          centerLat += doctor.latitude;
          centerLng += doctor.longitude;
          count++;
        }
      });

      // Default center if no locations
      if (count === 0) {
        centerLat = 40.7128; // Default to NYC
        centerLng = -74.0060;
        count = 1;
      } else {
        centerLat /= count;
        centerLng /= count;
      }

      // Reuse existing map or create new one
      if (!mapInstanceRef.current) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: count > 1 ? 12 : 10,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });
        mapInstanceRef.current = map;
      } else {
        // Update center if map exists
        mapInstanceRef.current.setCenter({ lat: centerLat, lng: centerLng });
        if (count > 1) {
          mapInstanceRef.current.setZoom(12);
        }
      }

      const map = mapInstanceRef.current;

      // Clear existing markers and info windows
      markersRef.current.forEach((marker) => marker.setMap(null));
      infoWindowsRef.current.forEach((iw) => iw.close());
      markersRef.current = [];
      infoWindowsRef.current = [];

      // Add patient location marker if available
      if (patientLatitude && patientLongitude) {
        const patientMarker = new window.google.maps.Marker({
          position: { lat: patientLatitude, lng: patientLongitude },
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
          title: "Your Location",
          zIndex: 1000,
        });
        markersRef.current.push(patientMarker);
      }

      // Add doctor markers - show all clinic locations for each doctor
      doctorsWithLocation.forEach((doctor) => {
        const fullName = [
          doctor.first_name,
          doctor.middle_name,
          doctor.last_name,
        ]
          .filter(Boolean)
          .join(" ");

        const clinics = doctor.clinics && doctor.clinics.length > 0 
          ? doctor.clinics.filter(c => c.latitude && c.longitude)
          : doctor.latitude && doctor.longitude
            ? [{
                address_id: 0,
                label: doctor.address_line1 ? "Primary Clinic" : null,
                address_line1: doctor.address_line1 || "",
                address_line2: doctor.address_line2 || null,
                city: doctor.city || "",
                state: doctor.state || null,
                postal_code: doctor.postal_code || null,
                country_code: doctor.country_code || null,
                latitude: doctor.latitude,
                longitude: doctor.longitude,
                place_id: doctor.place_id || null,
                is_primary: true,
                distance_km: doctor.distance_km || null,
              }]
            : [];

        clinics.forEach((clinic, clinicIndex) => {
          if (!clinic.latitude || !clinic.longitude) return;

          const clinicLabel = clinic.label || clinic.address_line1 || "Clinic";
          const clinicAddress = [
            clinic.address_line1,
            clinic.city,
            clinic.state,
            clinic.postal_code,
          ]
            .filter(Boolean)
            .join(", ");

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 16px;">${fullName}</h3>
                ${doctor.specialty ? `<p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${doctor.specialty}</p>` : ""}
                ${clinicLabel ? `<p style="margin: 4px 0; color: #666; font-size: 12px; font-weight: 500;">${clinicLabel}${clinic.is_primary ? ' (Primary)' : ''}</p>` : ""}
                ${clinicAddress ? `<p style="margin: 4px 0; color: #666; font-size: 12px;">${clinicAddress}</p>` : ""}
                ${doctor.google_rating ? `<p style="margin: 4px 0; color: #666; font-size: 12px;">⭐ ${doctor.google_rating.toFixed(1)}${doctor.google_user_ratings_total ? ` (${doctor.google_user_ratings_total} reviews)` : ""}</p>` : ""}
                ${clinic.distance_km ? `<p style="margin: 4px 0; color: #666; font-size: 12px;">📍 ${clinic.distance_km.toFixed(1)} km away</p>` : ""}
              </div>
            `,
          });

          const marker = new window.google.maps.Marker({
            position: { lat: clinic.latitude, lng: clinic.longitude },
            map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: clinic.is_primary ? 12 : 10,
              fillColor: clinic.is_primary ? "#EA4335" : "#FF6B6B",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: clinic.is_primary ? 3 : 2,
            },
            title: `${fullName} - ${clinicLabel}`,
          });

          marker.addListener("click", () => {
            infoWindowsRef.current.forEach((iw) => iw.close());
            infoWindow.open(map, marker);
            infoWindowsRef.current.push(infoWindow);
            if (onDoctorClick) {
              onDoctorClick(doctor);
            }
          });

          markersRef.current.push(marker);
        });
      });

      setIsMapLoaded(true);
    };

    // Load script and initialize map
    loadGoogleMapsScript()
      .then(() => {
        initializeMap();
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error);
      });

    return () => {
      // Cleanup markers on unmount
      markersRef.current.forEach((marker) => marker.setMap(null));
      infoWindowsRef.current.forEach((iw) => iw.close());
      markersRef.current = [];
      infoWindowsRef.current = [];
    };
  }, [doctors, patientLatitude, patientLongitude, apiKey, onDoctorClick]);

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500">
        Google Maps API key not configured
      </div>
    );
  }

  return (
    <div ref={mapRef} className="h-full w-full rounded-lg" style={{ minHeight: "400px" }} />
  );
}

