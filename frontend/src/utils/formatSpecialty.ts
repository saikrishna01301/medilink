import { formatSpecialtyLabel } from "./medicalSpecialties";

export const formatSpecialty = (specialty: string | null | undefined): string => {
  if (!specialty) {
    return "";
  }

  // Try to use the medical specialties data first
  const formatted = formatSpecialtyLabel(specialty);
  if (formatted) {
    return formatted;
  }

  // Fallback to the old formatting logic
  return specialty
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word === "&") {
        return "&";
      }
      if (word.length <= 3 && word === word.toUpperCase()) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};


