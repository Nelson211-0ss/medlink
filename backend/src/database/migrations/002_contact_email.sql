-- Optional public contact email for professionals (visible to organizations)
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email VARCHAR(320);
