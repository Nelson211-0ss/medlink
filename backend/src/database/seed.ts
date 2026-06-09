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
  for (const p of proSpecs) {
    const uid = await upsertUser({
      firstName: p.first,
      lastName: p.last,
      email: `${p.first.toLowerCase()}@medilink.health`,
      role: ROLES.PROFESSIONAL,
    });
    await query(
      `INSERT INTO healthcare_professionals
        (user_id, profession, specialization, experience_years, country, city, skills, availability, salary_expectation, verification_status, profile_completion, license_number)
       VALUES ($1,$2,$3,$4,'United States',$5,$6,'full_time',$7,$8,80,'LIC-' || left(md5(random()::text),6))
       ON CONFLICT (user_id) DO UPDATE SET specialization = EXCLUDED.specialization`,
      [uid, p.profession, p.spec, p.exp, p.city, p.skills, p.salary, VERIFICATION_STATUS.VERIFIED],
    );
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
