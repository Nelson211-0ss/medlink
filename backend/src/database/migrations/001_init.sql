-- ============================================================
-- MediNexus — initial schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ---------- enums ----------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('professional', 'organization', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deactivated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('draft', 'open', 'paused', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE application_stage AS ENUM ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('free', 'premium_professional', 'premium_organization');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete', 'trialing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      VARCHAR(80) NOT NULL,
  last_name       VARCHAR(80) NOT NULL,
  email           CITEXT,
  phone           VARCHAR(30),
  password_hash   TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'professional',
  avatar          TEXT,
  status          user_status NOT NULL DEFAULT 'pending',
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ---------- healthcare_professionals ----------
CREATE TABLE IF NOT EXISTS healthcare_professionals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  profession          VARCHAR(60),
  specialization      VARCHAR(120),
  experience_years    INTEGER NOT NULL DEFAULT 0,
  bio                 TEXT,
  availability        VARCHAR(40),
  salary_expectation  INTEGER,
  currency            VARCHAR(8) DEFAULT 'USD',
  location            VARCHAR(160),
  country             VARCHAR(80),
  city                VARCHAR(80),
  license_number      VARCHAR(120),
  skills              TEXT[] DEFAULT '{}',
  cv_url              TEXT,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  profile_completion  INTEGER NOT NULL DEFAULT 0,
  open_to_offers      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prof_profession ON healthcare_professionals (profession);
CREATE INDEX IF NOT EXISTS idx_prof_country ON healthcare_professionals (country);

-- ---------- organizations ----------
CREATE TABLE IF NOT EXISTS organizations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization_name   VARCHAR(160) NOT NULL,
  organization_type   VARCHAR(60),
  registration_number VARCHAR(120),
  website             VARCHAR(200),
  logo                TEXT,
  address             TEXT,
  country             VARCHAR(80),
  city                VARCHAR(80),
  description         TEXT,
  size                VARCHAR(40),
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_type ON organizations (organization_type);

-- ---------- education ----------
CREATE TABLE IF NOT EXISTS education (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES healthcare_professionals(id) ON DELETE CASCADE,
  institution     VARCHAR(200) NOT NULL,
  degree          VARCHAR(160),
  field_of_study  VARCHAR(160),
  start_year      INTEGER,
  end_year        INTEGER,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- certifications ----------
CREATE TABLE IF NOT EXISTS certifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  UUID NOT NULL REFERENCES healthcare_professionals(id) ON DELETE CASCADE,
  name             VARCHAR(200) NOT NULL,
  issuing_body     VARCHAR(200),
  issue_date       DATE,
  expiry_date      DATE,
  credential_id    VARCHAR(160),
  document_url     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- licenses ----------
CREATE TABLE IF NOT EXISTS licenses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id     UUID NOT NULL REFERENCES healthcare_professionals(id) ON DELETE CASCADE,
  license_type        VARCHAR(160) NOT NULL,
  license_number      VARCHAR(160),
  issuing_authority   VARCHAR(200),
  country             VARCHAR(80),
  issue_date          DATE,
  expiry_date         DATE,
  document_url        TEXT,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verified_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- work_experience ----------
CREATE TABLE IF NOT EXISTS work_experience (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  UUID NOT NULL REFERENCES healthcare_professionals(id) ON DELETE CASCADE,
  title            VARCHAR(160) NOT NULL,
  organization     VARCHAR(200),
  location         VARCHAR(160),
  start_date       DATE,
  end_date         DATE,
  is_current       BOOLEAN NOT NULL DEFAULT FALSE,
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- jobs ----------
CREATE TABLE IF NOT EXISTS jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title             VARCHAR(200) NOT NULL,
  description       TEXT,
  profession        VARCHAR(60),
  specialization    VARCHAR(120),
  skills            TEXT[] DEFAULT '{}',
  employment_type   VARCHAR(40),
  location          VARCHAR(160),
  country           VARCHAR(80),
  city              VARCHAR(80),
  is_remote         BOOLEAN NOT NULL DEFAULT FALSE,
  salary_min        INTEGER,
  salary_max        INTEGER,
  currency          VARCHAR(8) DEFAULT 'USD',
  experience_min    INTEGER DEFAULT 0,
  required_licenses TEXT[] DEFAULT '{}',
  status            job_status NOT NULL DEFAULT 'open',
  views_count       INTEGER NOT NULL DEFAULT 0,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_profession ON jobs (profession);
CREATE INDEX IF NOT EXISTS idx_jobs_org ON jobs (organization_id);

-- ---------- applications ----------
CREATE TABLE IF NOT EXISTS applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES healthcare_professionals(id) ON DELETE CASCADE,
  cover_letter    TEXT,
  cv_url          TEXT,
  stage           application_stage NOT NULL DEFAULT 'applied',
  notes           TEXT,
  match_score     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, professional_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_prof ON applications (professional_id);

-- ---------- matches ----------
CREATE TABLE IF NOT EXISTS matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES healthcare_professionals(id) ON DELETE CASCADE,
  match_score     INTEGER NOT NULL,
  reasons         JSONB NOT NULL DEFAULT '[]',
  org_action      VARCHAR(20),   -- liked | passed | null
  prof_action     VARCHAR(20),   -- liked | passed | null
  is_mutual       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, professional_id)
);

-- ---------- invitations ----------
CREATE TABLE IF NOT EXISTS invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES healthcare_professionals(id) ON DELETE CASCADE,
  job_id          UUID REFERENCES jobs(id) ON DELETE SET NULL,
  message         TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|accepted|declined
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- saved_candidates ----------
CREATE TABLE IF NOT EXISTS saved_candidates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES healthcare_professionals(id) ON DELETE CASCADE,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, professional_id)
);

-- ---------- saved_jobs ----------
CREATE TABLE IF NOT EXISTS saved_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES healthcare_professionals(id) ON DELETE CASCADE,
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, job_id)
);

-- ---------- conversations & messages ----------
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT,
  attachment_url  TEXT,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at);

-- ---------- notifications ----------
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(40) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read);

-- ---------- subscriptions ----------
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                    subscription_plan NOT NULL DEFAULT 'free',
  status                  subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id      VARCHAR(120),
  stripe_subscription_id  VARCHAR(120),
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions (user_id);

-- ---------- refresh_tokens ----------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  user_agent  TEXT,
  ip_address  VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens (user_id);

-- ---------- verification & reset tokens ----------
CREATE TABLE IF NOT EXISTS auth_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  purpose     VARCHAR(40) NOT NULL,  -- email_verify | password_reset
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- audit_logs ----------
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80),
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  ip_address  VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs (actor_id);

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY['users','healthcare_professionals','organizations','jobs',
                        'applications','matches','invitations','conversations',
                        'subscriptions'])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated ON %1$s;
       CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON %1$s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t);
  END LOOP;
END $$;
