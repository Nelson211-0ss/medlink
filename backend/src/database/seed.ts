import { pool, query } from './pool';
import { runMigrations } from './migrate';
import { hashPassword } from '../utils/password';
import { logger } from '../config/logger';
import { ROLES, USER_STATUS, VERIFICATION_STATUS } from '../utils/constants';

/** Seed demo data for local development. Idempotent on email. */
const seed = async () => {
  await runMigrations();
  const password = await hashPassword('Password123');

  const upsertUser = async (u: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }) => {
    const { rows } = await query<{ id: string }>(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, status, email_verified)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE)
       ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
       RETURNING id`,
      [u.firstName, u.lastName, u.email, password, u.role, USER_STATUS.ACTIVE],
    );
    return rows[0].id;
  };

  // Admin
  await upsertUser({ firstName: 'System', lastName: 'Admin', email: 'admin@medilink.health', role: ROLES.ADMIN });

  // Organization
  const orgUserId = await upsertUser({
    firstName: 'Grace',
    lastName: 'Hospital',
    email: 'org@medilink.health',
    role: ROLES.ORGANIZATION,
  });
  const { rows: orgRows } = await query<{ id: string }>(
    `INSERT INTO organizations (user_id, organization_name, organization_type, country, city, verification_status, description)
     VALUES ($1,'Grace Medical Center','hospital','United States','Boston, MA',$2,'A leading multi-specialty teaching hospital in the Northeast.')
     ON CONFLICT (user_id) DO UPDATE SET organization_name = EXCLUDED.organization_name
     RETURNING id`,
    [orgUserId, VERIFICATION_STATUS.VERIFIED],
  );
  const orgId = orgRows[0].id;

  // Professionals — salary_expectation values are annual USD
  const proSpecs = [
    { first: 'Ashley', last: 'Carter', profession: 'nurse', spec: 'ICU', exp: 5, city: 'Boston, MA', skills: ['ICU', 'Triage', 'ACLS'], salary: 95000 },
    { first: 'David', last: 'Nguyen', profession: 'doctor', spec: 'Cardiology', exp: 8, city: 'New York, NY', skills: ['ECG', 'Echocardiography'], salary: 320000 },
    { first: 'Maria', last: 'Rodriguez', profession: 'pharmacist', spec: 'Clinical Pharmacy', exp: 4, city: 'Chicago, IL', skills: ['Dispensing', 'Counseling'], salary: 125000 },
  ];
  const proIds: Record<string, string> = {};
  for (const p of proSpecs) {
    const email = `${p.first.toLowerCase()}@medilink.health`;
    const uid = await upsertUser({
      firstName: p.first,
      lastName: p.last,
      email,
      role: ROLES.PROFESSIONAL,
    });
    const { rows } = await query<{ id: string }>(
      `INSERT INTO healthcare_professionals
        (user_id, profession, specialization, experience_years, country, city, skills, availability, salary_expectation, verification_status, profile_completion, license_number)
       VALUES ($1,$2,$3,$4,'United States',$5,$6,'full_time',$7,$8,80,'LIC-' || left(md5(random()::text),6))
       ON CONFLICT (user_id) DO UPDATE SET specialization = EXCLUDED.specialization
       RETURNING id`,
      [uid, p.profession, p.spec, p.exp, p.city, p.skills, p.salary, VERIFICATION_STATUS.VERIFIED],
    );
    proIds[email] = rows[0].id;
  }

  const seedResumeIfEmpty = async (professionalId: string, fn: () => Promise<void>) => {
    const { rows } = await query<{ count: string }>(
      `SELECT (
        (SELECT COUNT(*) FROM work_experience WHERE professional_id = $1) +
        (SELECT COUNT(*) FROM education WHERE professional_id = $1)
      )::text AS count`,
      [professionalId],
    );
    if (Number(rows[0]?.count ?? 0) === 0) await fn();
  };

  // Ashley Carter — full ICU nurse resume
  const ashleyId = proIds['ashley@medilink.health'];
  if (ashleyId) {
    await query(
      `UPDATE healthcare_professionals SET
        bio = $2,
        profile_completion = 95,
        license_number = 'RN-MA-482910'
       WHERE id = $1`,
      [
        ashleyId,
        'Dedicated ICU registered nurse with 5+ years of critical care experience in high-acuity trauma and surgical units. Skilled in ventilator management, hemodynamic monitoring, and rapid response coordination. Passionate about patient advocacy and interdisciplinary teamwork.',
      ],
    );
    await seedResumeIfEmpty(ashleyId, async () => {
      await query(
        `INSERT INTO work_experience (professional_id, title, organization, location, start_date, end_date, is_current, description) VALUES
         ($1, 'ICU Registered Nurse', 'Massachusetts General Hospital', 'Boston, MA', '2021-03-01', NULL, TRUE,
          'Provide critical care for post-operative and trauma patients in a 24-bed Level I ICU. Lead rapid response assessments, manage ventilated patients, and mentor new graduate nurses.'),
         ($1, 'Staff Nurse — Medical Surgical', 'Boston Medical Center', 'Boston, MA', '2019-06-01', '2021-02-28', FALSE,
          'Delivered bedside care on a 32-bed med-surg unit with focus on cardiac and pulmonary patients. Maintained excellent patient satisfaction scores and charge nurse coverage.')`,
        [ashleyId],
      );
      await query(
        `INSERT INTO education (professional_id, institution, degree, field_of_study, start_year, end_year, description) VALUES
         ($1, 'Boston College', 'BSN', 'Nursing', 2015, 2019, 'Clinical honors. Capstone in critical care nursing.')`,
        [ashleyId],
      );
      await query(
        `INSERT INTO certifications (professional_id, name, issuing_body, issue_date, expiry_date) VALUES
         ($1, 'Advanced Cardiovascular Life Support (ACLS)', 'American Heart Association', '2024-01-15', '2026-01-15'),
         ($1, 'Basic Life Support (BLS)', 'American Heart Association', '2024-01-15', '2026-01-15')`,
        [ashleyId],
      );
      await query(
        `INSERT INTO licenses (professional_id, license_type, license_number, issuing_authority, country, issue_date, expiry_date, verification_status) VALUES
         ($1, 'Registered Nurse (RN)', 'RN-MA-482910', 'Massachusetts Board of Registration in Nursing', 'United States', '2019-05-01', '2027-05-01', 'verified')`,
        [ashleyId],
      );
    });
  }

  // David Nguyen — full cardiologist resume
  const davidId = proIds['david@medilink.health'];
  if (davidId) {
    await query(
      `UPDATE healthcare_professionals SET
        bio = $2,
        profile_completion = 95,
        license_number = 'MD-NY-7734521'
       WHERE id = $1`,
      [
        davidId,
        'Board-eligible cardiologist with 8 years of training and clinical experience in interventional and non-invasive cardiology. Expertise in echocardiography, heart failure management, and complex coronary disease. Committed to evidence-based care and patient education.',
      ],
    );
    await seedResumeIfEmpty(davidId, async () => {
      await query(
        `INSERT INTO work_experience (professional_id, title, organization, location, start_date, end_date, is_current, description) VALUES
         ($1, 'Attending Cardiologist', 'Mount Sinai Hospital', 'New York, NY', '2022-07-01', NULL, TRUE,
          'Manage inpatient cardiology consults, supervise fellows, and perform transthoracic and stress echocardiography. Co-lead the hospital heart failure pathway initiative.'),
         ($1, 'Cardiology Fellow', 'NewYork-Presbyterian / Columbia', 'New York, NY', '2019-07-01', '2022-06-30', FALSE,
          'Completed three-year fellowship with rotations in interventional cardiology, electrophysiology, and advanced imaging.')`,
        [davidId],
      );
      await query(
        `INSERT INTO education (professional_id, institution, degree, field_of_study, start_year, end_year, description) VALUES
         ($1, 'Johns Hopkins University School of Medicine', 'MD', 'Medicine', 2011, 2015, 'Alpha Omega Alpha honor society.'),
         ($1, 'University of California, Berkeley', 'BS', 'Molecular Biology', 2007, 2011, 'Summa cum laude.')`,
        [davidId],
      );
      await query(
        `INSERT INTO certifications (professional_id, name, issuing_body, issue_date) VALUES
         ($1, 'Board Certified — Internal Medicine', 'American Board of Internal Medicine', '2019-06-01'),
         ($1, 'Advanced Cardiac Life Support (ACLS)', 'American Heart Association', '2024-03-01')`,
        [davidId],
      );
      await query(
        `INSERT INTO licenses (professional_id, license_type, license_number, issuing_authority, country, issue_date, expiry_date, verification_status) VALUES
         ($1, 'Physician and Surgeon', 'MD-NY-7734521', 'New York State Education Department', 'United States', '2016-08-01', '2026-08-01', 'verified')`,
        [davidId],
      );
    });
  }

  // Jobs — salary ranges are annual USD
  await query(
    `INSERT INTO jobs (organization_id, title, description, profession, specialization, skills, employment_type, country, city, salary_min, salary_max, experience_min, status)
     VALUES
       ($1,'ICU Registered Nurse','Provide critical care in our Level I trauma ICU.','nurse','ICU',ARRAY['ICU','ACLS'],'full_time','United States','Boston, MA',85000,110000,3,'open'),
       ($1,'Consultant Cardiologist','Lead our cardiology service line.','doctor','Cardiology',ARRAY['ECG'],'full_time','United States','Boston, MA',280000,400000,5,'open')
     ON CONFLICT DO NOTHING`,
    [orgId],
  );

  logger.info('✅ Seed complete. Login with any seeded email / Password123');
};

seed()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, 'Seed failed');
    process.exit(1);
  });
