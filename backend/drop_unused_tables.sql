-- SQL script to drop unused tables
-- Run this script in your PostgreSQL database
-- 
-- IMPORTANT: Backup your database before running this script!
-- These tables will be permanently deleted along with all their data.

-- Drop tables in order to avoid foreign key constraint violations
-- CASCADE will automatically drop dependent foreign key constraints

-- 1. Drop doctor_clinic_assignments (has FK to clinics)
DROP TABLE IF EXISTS doctor_clinic_assignments CASCADE;

-- 2. Drop doctor_availability (may have FK to clinics)
DROP TABLE IF EXISTS doctor_availability CASCADE;

-- 3. Drop doctor_insurance_acceptance
DROP TABLE IF EXISTS doctor_insurance_acceptance CASCADE;

-- 4. Finally, drop the clinics table itself
DROP TABLE IF EXISTS clinics CASCADE;

-- Optional: If patient_doctor_relationships table exists and references clinics,
-- you may want to drop it too if you're not using it:
-- DROP TABLE IF EXISTS patient_doctor_relationships CASCADE;

-- Verify tables are dropped (optional - run this to check)
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('clinics', 'doctor_clinic_assignments', 'doctor_availability', 'doctor_insurance_acceptance');

