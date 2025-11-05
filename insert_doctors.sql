-- Doctor Data Insert Script
-- Generated on: 2025-11-05 11:57:40

BEGIN TRANSACTION;


-- Doctor: John Smith
INSERT INTO users (user_id, first_name, last_name, email, phone, password_hash, is_patient, role, accepted_terms, created_at)
VALUES (
    101,
    'John',
    'Smith',
    'john.smith@medilink.com',
    '555-0101',
    '$2b$12$w4hX5ISRkgy4kW1FhWDnUODgFc.zyTHq/cXzJJIKSQszELQlU5Ly.',
    FALSE,
    'doctor',
    TRUE,
    NOW()
);


INSERT INTO doctor_profiles (user_id, specialty, bio, years_of_experience, medical_license_number, board_certifications, languages_spoken, created_at)
VALUES (
    101,
    'GP & Cardiology',
    'Experienced general practitioner with specialization in cardiology. Board certified.',
    15,
    'MD123456',
    ARRAY{"American Board of Internal Medicine","Cardiology Certification"}::text[],
    ARRAY{"English","Spanish"}::text[],
    NOW()
);


-- Clinic: Lifeline Clinic
INSERT INTO clinics (clinic_id, name, address_line1, city, state, zip_code, country, phone, created_at)
VALUES (
    1001,
    'Lifeline Clinic',
    '123 Medical Center Dr',
    'New York',
    'NY',
    '10001',
    'USA',
    '555-123-4567',
    NOW()
);


INSERT INTO doctor_clinic_assignments (doctor_user_id, clinic_id, is_primary, consultation_fee, available_from, available_to, days_of_week, accepting_new_patients, created_at)
VALUES (
    101,
    1001,
    TRUE,
    150.0,
    '09:00',
    '17:00',
    ARRAY{1,2,3,4,5}::integer[],
    TRUE,
    NOW()
);


-- Doctor: Sarah Johnson
INSERT INTO users (user_id, first_name, last_name, email, phone, password_hash, is_patient, role, accepted_terms, created_at)
VALUES (
    102,
    'Sarah',
    'Johnson',
    'sarah.johnson@medilink.com',
    '555-0102',
    '$2b$12$QWlR42tUazm8ju6K1/KpcuBQFlYyvYtLQ7gYIV044JNEjHKdHo8hy',
    FALSE,
    'doctor',
    TRUE,
    NOW()
);


INSERT INTO doctor_profiles (user_id, specialty, bio, years_of_experience, medical_license_number, board_certifications, languages_spoken, created_at)
VALUES (
    102,
    'Dermatology',
    'Board-certified dermatologist specializing in skin health and cosmetic procedures.',
    10,
    'MD123457',
    ARRAY{"American Board of Dermatology"}::text[],
    ARRAY{"English","French"}::text[],
    NOW()
);


-- Clinic: Skin Health Center
INSERT INTO clinics (clinic_id, name, address_line1, city, state, zip_code, country, phone, created_at)
VALUES (
    1002,
    'Skin Health Center',
    '456 Skin Care Ave',
    'New York',
    'NY',
    '10002',
    'USA',
    '555-234-5678',
    NOW()
);


INSERT INTO doctor_clinic_assignments (doctor_user_id, clinic_id, is_primary, consultation_fee, available_from, available_to, days_of_week, accepting_new_patients, created_at)
VALUES (
    102,
    1002,
    TRUE,
    200.0,
    '10:00',
    '18:00',
    ARRAY{1,3,5}::integer[],
    FALSE,
    NOW()
);


-- Doctor: Michael Chen
INSERT INTO users (user_id, first_name, last_name, email, phone, password_hash, is_patient, role, accepted_terms, created_at)
VALUES (
    103,
    'Michael',
    'Chen',
    'michael.chen@medilink.com',
    '555-0103',
    '$2b$12$B9XAE/OBVJPmz3PBpEO5/.gvoRX.yCfhOR/MmVUBm/6WsGisD2bFS',
    FALSE,
    'doctor',
    TRUE,
    NOW()
);


INSERT INTO doctor_profiles (user_id, specialty, bio, years_of_experience, medical_license_number, board_certifications, languages_spoken, created_at)
VALUES (
    103,
    'Orthopedics',
    'Orthopedic surgeon with expertise in joint replacement and sports medicine.',
    20,
    'MD123458',
    ARRAY{"American Board of Orthopedic Surgery"}::text[],
    ARRAY{"English","Mandarin"}::text[],
    NOW()
);


-- Clinic: Bone & Joint Clinic
INSERT INTO clinics (clinic_id, name, address_line1, city, state, zip_code, country, phone, created_at)
VALUES (
    1003,
    'Bone & Joint Clinic',
    '789 Orthopedic St',
    'New York',
    'NY',
    '10003',
    'USA',
    '555-345-6789',
    NOW()
);


INSERT INTO doctor_clinic_assignments (doctor_user_id, clinic_id, is_primary, consultation_fee, available_from, available_to, days_of_week, accepting_new_patients, created_at)
VALUES (
    103,
    1003,
    TRUE,
    250.0,
    '08:00',
    '16:00',
    ARRAY{1,2,3,4}::integer[],
    TRUE,
    NOW()
);


-- Doctor: Emily Rodriguez
INSERT INTO users (user_id, first_name, last_name, email, phone, password_hash, is_patient, role, accepted_terms, created_at)
VALUES (
    104,
    'Emily',
    'Rodriguez',
    'emily.rodriguez@medilink.com',
    '555-0104',
    '$2b$12$f9yUT4QdhHWClq0yfs0qtO5LsZ0Wl9rChbmfIBnX5Lf85rH/z/6sG',
    FALSE,
    'doctor',
    TRUE,
    NOW()
);


INSERT INTO doctor_profiles (user_id, specialty, bio, years_of_experience, medical_license_number, board_certifications, languages_spoken, created_at)
VALUES (
    104,
    'Pediatrics',
    'Pediatrician dedicated to children''s health and wellness.',
    8,
    'MD123459',
    ARRAY{"American Board of Pediatrics"}::text[],
    ARRAY{"English","Spanish"}::text[],
    NOW()
);


-- Clinic: Children's Health Center
INSERT INTO clinics (clinic_id, name, address_line1, city, state, zip_code, country, phone, created_at)
VALUES (
    1004,
    'Children's Health Center',
    '321 Kids Way',
    'New York',
    'NY',
    '10004',
    'USA',
    '555-456-7890',
    NOW()
);


INSERT INTO doctor_clinic_assignments (doctor_user_id, clinic_id, is_primary, consultation_fee, available_from, available_to, days_of_week, accepting_new_patients, created_at)
VALUES (
    104,
    1004,
    TRUE,
    120.0,
    '09:00',
    '17:00',
    ARRAY{1,2,3,4,5,6}::integer[],
    TRUE,
    NOW()
);


-- Doctor: Robert Kim
INSERT INTO users (user_id, first_name, last_name, email, phone, password_hash, is_patient, role, accepted_terms, created_at)
VALUES (
    105,
    'Robert',
    'Kim',
    'robert.kim@medilink.com',
    '555-0105',
    '$2b$12$Nr5lphEKBpTIi.uptYoa9.87efjbGJBFqDQ6Lsqp3Bll2MgGRMhS.',
    FALSE,
    'doctor',
    TRUE,
    NOW()
);


INSERT INTO doctor_profiles (user_id, specialty, bio, years_of_experience, medical_license_number, board_certifications, languages_spoken, created_at)
VALUES (
    105,
    'Neurology',
    'Neurologist specializing in brain and nervous system disorders.',
    18,
    'MD123460',
    ARRAY{"American Board of Psychiatry and Neurology"}::text[],
    ARRAY{"English","Korean"}::text[],
    NOW()
);


-- Clinic: Brain & Spine Institute
INSERT INTO clinics (clinic_id, name, address_line1, city, state, zip_code, country, phone, created_at)
VALUES (
    1005,
    'Brain & Spine Institute',
    '654 Neuro Ave',
    'Brooklyn',
    'NY',
    '11201',
    'USA',
    '555-567-8901',
    NOW()
);


INSERT INTO doctor_clinic_assignments (doctor_user_id, clinic_id, is_primary, consultation_fee, available_from, available_to, days_of_week, accepting_new_patients, created_at)
VALUES (
    105,
    1005,
    TRUE,
    300.0,
    '10:00',
    '18:00',
    ARRAY{2,4}::integer[],
    TRUE,
    NOW()
);


-- Doctor: Lisa Wang
INSERT INTO users (user_id, first_name, last_name, email, phone, password_hash, is_patient, role, accepted_terms, created_at)
VALUES (
    106,
    'Lisa',
    'Wang',
    'lisa.wang@medilink.com',
    '555-0106',
    '$2b$12$maD3QYWIO6A8/VqNsvpQe.PEkSp17g4v7QuhvLzudqLaB/lT3pcoy',
    FALSE,
    'doctor',
    TRUE,
    NOW()
);


INSERT INTO doctor_profiles (user_id, specialty, bio, years_of_experience, medical_license_number, board_certifications, languages_spoken, created_at)
VALUES (
    106,
    'Endocrinology',
    'Endocrinologist focused on diabetes and hormone disorders.',
    12,
    'MD123461',
    ARRAY{"American Board of Internal Medicine - Endocrinology"}::text[],
    ARRAY{"English","Mandarin"}::text[],
    NOW()
);


-- Clinic: Metabolic Health Clinic
INSERT INTO clinics (clinic_id, name, address_line1, city, state, zip_code, country, phone, created_at)
VALUES (
    1006,
    'Metabolic Health Clinic',
    '987 Hormone Blvd',
    'Queens',
    'NY',
    '11101',
    'USA',
    '555-678-9012',
    NOW()
);


INSERT INTO doctor_clinic_assignments (doctor_user_id, clinic_id, is_primary, consultation_fee, available_from, available_to, days_of_week, accepting_new_patients, created_at)
VALUES (
    106,
    1006,
    TRUE,
    180.0,
    '09:00',
    '17:00',
    ARRAY{1,2,3,4,5}::integer[],
    TRUE,
    NOW()
);


-- Doctor: James Wilson
INSERT INTO users (user_id, first_name, last_name, email, phone, password_hash, is_patient, role, accepted_terms, created_at)
VALUES (
    107,
    'James',
    'Wilson',
    'james.wilson@medilink.com',
    '555-0107',
    '$2b$12$SEk3SRh1mvyXUMq.uxEyMuzcXiS6/jPk95e3UScK7qtHROOhACg6C',
    FALSE,
    'doctor',
    TRUE,
    NOW()
);


INSERT INTO doctor_profiles (user_id, specialty, bio, years_of_experience, medical_license_number, board_certifications, languages_spoken, created_at)
VALUES (
    107,
    'Cardiology',
    'Cardiologist with extensive experience in heart disease treatment.',
    25,
    'MD123462',
    ARRAY{"American Board of Internal Medicine - Cardiology"}::text[],
    ARRAY{"English"}::text[],
    NOW()
);


-- Clinic: Heart Care Center
INSERT INTO clinics (clinic_id, name, address_line1, city, state, zip_code, country, phone, created_at)
VALUES (
    1007,
    'Heart Care Center',
    '147 Cardiac Lane',
    'Manhattan',
    'NY',
    '10007',
    'USA',
    '555-789-0123',
    NOW()
);


INSERT INTO doctor_clinic_assignments (doctor_user_id, clinic_id, is_primary, consultation_fee, available_from, available_to, days_of_week, accepting_new_patients, created_at)
VALUES (
    107,
    1007,
    TRUE,
    275.0,
    '08:00',
    '16:00',
    ARRAY{1,2,3,4,5}::integer[],
    FALSE,
    NOW()
);


-- Doctor: Patricia Martinez
INSERT INTO users (user_id, first_name, last_name, email, phone, password_hash, is_patient, role, accepted_terms, created_at)
VALUES (
    108,
    'Patricia',
    'Martinez',
    'patricia.martinez@medilink.com',
    '555-0108',
    '$2b$12$oUYICkZDsHBocHCcQqwlu.AkHuxl9w1dpCY0rmWX.Pa3XemBOXrMq',
    FALSE,
    'doctor',
    TRUE,
    NOW()
);


INSERT INTO doctor_profiles (user_id, specialty, bio, years_of_experience, medical_license_number, board_certifications, languages_spoken, created_at)
VALUES (
    108,
    'General Practice',
    'Family medicine physician providing comprehensive primary care.',
    14,
    'MD123463',
    ARRAY{"American Board of Family Medicine"}::text[],
    ARRAY{"English","Spanish"}::text[],
    NOW()
);


-- Clinic: Community Health Clinic
INSERT INTO clinics (clinic_id, name, address_line1, city, state, zip_code, country, phone, created_at)
VALUES (
    1008,
    'Community Health Clinic',
    '258 Main Street',
    'Bronx',
    'NY',
    '10451',
    'USA',
    '555-890-1234',
    NOW()
);


INSERT INTO doctor_clinic_assignments (doctor_user_id, clinic_id, is_primary, consultation_fee, available_from, available_to, days_of_week, accepting_new_patients, created_at)
VALUES (
    108,
    1008,
    TRUE,
    130.0,
    '09:00',
    '17:00',
    ARRAY{1,2,3,4,5}::integer[],
    TRUE,
    NOW()
);


COMMIT;