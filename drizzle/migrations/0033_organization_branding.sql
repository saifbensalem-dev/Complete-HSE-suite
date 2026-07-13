ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "legal_name" varchar(256);
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "logo_url" varchar(2048);
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "primary_color" varchar(7) DEFAULT '#047857' NOT NULL;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "locale" varchar(16) DEFAULT 'en' NOT NULL;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "country_code" varchar(2);
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "timezone" varchar(64) DEFAULT 'UTC' NOT NULL;

ALTER TABLE "organization" ADD CONSTRAINT "organization_primary_color_hex"
  CHECK ("primary_color" ~ '^#[0-9A-Fa-f]{6}$');
ALTER TABLE "organization" ADD CONSTRAINT "organization_locale_supported"
  CHECK ("locale" IN ('en', 'ar', 'fr'));
ALTER TABLE "organization" ADD CONSTRAINT "organization_country_code_iso2"
  CHECK ("country_code" IS NULL OR "country_code" ~ '^[A-Z]{2}$');
