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
  await upsertUser({ firstName: 'System', lastName: 'Admin', email: 'admin@medinexus.health', role: ROLES.ADMIN });

  // Organization
  const orgUserId = await upsertUser({
    firstName: 'Grace',
    lastName: 'Hospital',
    email: 'org@medinexus.health',
    role: ROLES.ORGANIZATION,
  });
  const { rows: orgRows } = await query<{ id: string }>(
    `INSERT INTO organizations (user_id, organization_name, organization_type, country, city, verification_status, description)
     VALUES ($1,'Grace Medical Center','hospital','Uganda','Kampala',$2,'A leading multi-specialty hospital.')
     ON CONFLICT (user_id) DO UPDATE SET organization_name = EXCLUDED.organization_name
     RETURNING id`,
    [orgUserId, VERIFICATION_STATUS.VERIFIED],
  );
  const orgId = orgRows[0].id;

  // Professionals
  const proSpecs = [
    { first: 'Aisha', last: 'Nakato', profession: 'nurse', spec: 'ICU', exp: 5, city: 'Kampala', skills: ['ICU', 'Triage', 'ACLS'] },
    { first: 'David', last: 'Okello', profession: 'doctor', spec: 'Cardiology', exp: 8, city: 'Kampala', skills: ['ECG', 'Echocardiography'] },
    { first: 'Mary', last: 'Achieng', profession: 'pharmacist', spec: 'Clinical Pharmacy', exp: 4, city: 'Jinja', skills: ['Dispensing', 'Counseling'] },
  ];
  for (const p of proSpecs) {
    const uid = await upsertUser({
      firstName: p.first,
      lastName: p.last,
      email: `${p.first.toLowerCase()}@medinexus.health`,
      role: ROLES.PROFESSIONAL,
    });
    await query(
      `INSERT INTO healthcare_professionals
        (user_id, profession, specialization, experience_years, country, city, skills, availability, salary_expectation, verification_status, profile_completion, license_number)
       VALUES ($1,$2,$3,$4,'Uganda',$5,$6,'full_time',1200,$7,80,'LIC-' || left(md5(random()::text),6))
       ON CONFLICT (user_id) DO UPDATE SET specialization = EXCLUDED.specialization`,
      [uid, p.profession, p.spec, p.exp, p.city, p.skills, VERIFICATION_STATUS.VERIFIED],
    );
  }

  // Jobs
  await query(
    `INSERT INTO jobs (organization_id, title, description, profession, specialization, skills, employment_type, country, city, salary_min, salary_max, experience_min, status)
     VALUES
       ($1,'ICU Registered Nurse','Provide critical care in our ICU.','nurse','ICU',ARRAY['ICU','ACLS'],'full_time','Uganda','Kampala',1000,1500,3,'open'),
       ($1,'Consultant Cardiologist','Lead our cardiology unit.','doctor','Cardiology',ARRAY['ECG'],'full_time','Uganda','Kampala',3000,5000,5,'open')
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
