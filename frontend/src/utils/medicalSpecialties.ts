// Medical specialties with NUCC codes
export interface MedicalSpecialty {
  code: string; // NUCC code
  value: string; // Internal value (snake_case)
  label: string; // Display label
  description: string; // Full description
}

export const MEDICAL_SPECIALTIES: MedicalSpecialty[] = [
  { code: "207K00000X", value: "allergist_immunologist", label: "Allergist / Immunologist", description: "Allergy & Immunology" },
  { code: "207L00000X", value: "anesthesiologist", label: "Anesthesiologist", description: "Anesthesiology" },
  { code: "207RC0000X", value: "cardiologist", label: "Cardiologist", description: "Cardiovascular Disease" },
  { code: "208C00000X", value: "colon_rectal_surgeon", label: "Colon and Rectal Surgeon", description: "Colon & Rectal Surgery" },
  { code: "207N00000X", value: "dermatologist", label: "Dermatologist", description: "Dermatology" },
  { code: "2085R0202X", value: "radiologist", label: "Radiologist", description: "Diagnostic Radiology" },
  { code: "207P00000X", value: "emergency_medicine_physician", label: "Emergency Medicine Physician", description: "Emergency Medicine" },
  { code: "207RE0101X", value: "endocrinologist", label: "Endocrinologist", description: "Endocrinology, Diabetes & Metabolism" },
  { code: "207Q00000X", value: "family_medicine_physician", label: "Family Medicine Physician", description: "Family Medicine" },
  { code: "207RG0100X", value: "gastroenterologist", label: "Gastroenterologist", description: "Gastroenterology" },
  { code: "208600000X", value: "general_surgeon", label: "General Surgeon", description: "Surgery (General)" },
  { code: "207RG0300X", value: "geriatrician", label: "Geriatrician", description: "Geriatric Medicine (Internal Medicine)" },
  { code: "207RH0000X", value: "hematologist", label: "Hematologist", description: "Hematology (Internal Medicine)" },
  { code: "207RI0200X", value: "infectious_disease_specialist", label: "Infectious Disease Specialist", description: "Infectious Disease" },
  { code: "207R00000X", value: "internist", label: "Internist", description: "Internal Medicine" },
  { code: "207SG0201X", value: "medical_geneticist", label: "Medical Geneticist", description: "Clinical Genetics (M.D.)" },
  { code: "207RN0300X", value: "nephrologist", label: "Nephrologist", description: "Nephrology" },
  { code: "207T00000X", value: "neurosurgeon", label: "Neurosurgeon", description: "Neurological Surgery" },
  { code: "2084N0400X", value: "neurologist", label: "Neurologist", description: "Neurology" },
  { code: "2085N0700X", value: "nuclear_medicine_specialist", label: "Nuclear Medicine Specialist", description: "Nuclear Medicine" },
  { code: "207V00000X", value: "obstetrician_gynecologist", label: "Obstetrician-Gynecologist", description: "Obstetrics & Gynecology" },
  { code: "207RX0201X", value: "oncologist", label: "Oncologist", description: "Medical Oncology" },
  { code: "207W00000X", value: "ophthalmologist", label: "Ophthalmologist", description: "Ophthalmology" },
  { code: "207X00000X", value: "orthopedic_surgeon", label: "Orthopedic Surgeon", description: "Orthopaedic Surgery" },
  { code: "207Y00000X", value: "otolaryngologist_ent", label: "Otolaryngologist / ENT", description: "Otolaryngology" },
  { code: "207ZP0101X", value: "pathologist", label: "Pathologist", description: "Anatomic & Clinical Pathology" },
  { code: "208000000X", value: "pediatrician", label: "Pediatrician", description: "Pediatrics" },
  { code: "208100000X", value: "physiatrist", label: "Physiatrist", description: "Physical Medicine & Rehabilitation" },
  { code: "208200000X", value: "plastic_surgeon", label: "Plastic Surgeon", description: "Plastic Surgery" },
  { code: "2083P0500X", value: "preventive_medicine_specialist", label: "Preventive Medicine Spec.", description: "Preventive Medicine" },
  { code: "2084P0800X", value: "psychiatrist", label: "Psychiatrist", description: "Psychiatry" },
  { code: "207RP1001X", value: "pulmonologist", label: "Pulmonologist", description: "Pulmonary Disease" },
  { code: "2085R0001X", value: "radiation_oncologist", label: "Radiation Oncologist", description: "Radiation Oncology" },
  { code: "207RR0500X", value: "rheumatologist", label: "Rheumatologist", description: "Rheumatology" },
  { code: "2084S0012X", value: "sleep_medicine_specialist", label: "Sleep Medicine Specialist", description: "Sleep Medicine (Psychiatry & Neurology)" },
  { code: "207QS0010X", value: "sports_medicine_specialist", label: "Sports Medicine Specialist", description: "Sports Medicine (Family Medicine)" },
  { code: "208800000X", value: "urologist", label: "Urologist", description: "Urology" },
  { code: "2086S0122X", value: "vascular_surgeon", label: "Vascular Surgeon", description: "Vascular Surgery" },
] as const;

// Helper function to get specialty by value
export const getSpecialtyByValue = (value: string): MedicalSpecialty | undefined => {
  return MEDICAL_SPECIALTIES.find(s => s.value === value);
};

// Helper function to get specialty by code
export const getSpecialtyByCode = (code: string): MedicalSpecialty | undefined => {
  return MEDICAL_SPECIALTIES.find(s => s.code === code);
};

// Helper function to format specialty for display
export const formatSpecialtyLabel = (value: string | null | undefined): string => {
  if (!value) return "";
  const specialty = getSpecialtyByValue(value);
  return specialty ? specialty.label : value;
};

// Get all specialty values (for backward compatibility)
export const getAllSpecialtyValues = (): string[] => {
  return MEDICAL_SPECIALTIES.map(s => s.value);
};
