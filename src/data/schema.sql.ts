/** SQLite schema — mirrored conceptually in Rust for native builds. */
export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS company (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  logo_data_url TEXT,
  trip_number_prefix TEXT NOT NULL DEFAULT 'DEL/',
  trip_number_next INTEGER NOT NULL DEFAULT 1,
  simplify_workflow INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_user (
  id TEXT PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  employee_id TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS employee (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  employee_number TEXT NOT NULL UNIQUE,
  position TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  workplace TEXT,
  residence_city TEXT,
  bank_account TEXT,
  manager_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  owner_employee_id TEXT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  engine_capacity_ccm INTEGER,
  engine_category TEXT NOT NULL,
  custom_mileage_rate TEXT,
  custom_rate_basis TEXT,
  needs_accounting_review INTEGER NOT NULL DEFAULT 0,
  usage_form TEXT,
  default_user_id TEXT,
  employer_consent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS business_trip (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  issued_at TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  description TEXT,
  start_place TEXT NOT NULL,
  planned_start_at TEXT NOT NULL,
  planned_end_at TEXT NOT NULL,
  actual_start_at TEXT,
  actual_end_at TEXT,
  is_foreign INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  requester_id TEXT,
  approver_id TEXT,
  notes TEXT,
  diet_disabled INTEGER NOT NULL DEFAULT 0,
  diet_disabled_reason TEXT,
  destinations_json TEXT NOT NULL DEFAULT '[]',
  segments_json TEXT NOT NULL DEFAULT '[]',
  meals_json TEXT NOT NULL DEFAULT '[]',
  accommodations_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expense (
  id TEXT PRIMARY KEY,
  trip_id TEXT,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL,
  country_code TEXT,
  vendor TEXT,
  document_number TEXT,
  vat_amount TEXT,
  payment_method TEXT,
  paid_by TEXT NOT NULL,
  refund_amount TEXT NOT NULL,
  accepted INTEGER NOT NULL DEFAULT 1,
  comment TEXT,
  without_receipt INTEGER NOT NULL DEFAULT 0,
  without_receipt_statement TEXT,
  attachment_ids_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attachment (
  id TEXT PRIMARY KEY,
  expense_id TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  data_url TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS advance (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  requested_amount TEXT NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  approved_amount TEXT,
  paid_amount TEXT,
  paid_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settlement (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  due_at TEXT,
  total_due_before_advance TEXT NOT NULL,
  advances_paid TEXT NOT NULL,
  amount_to_pay_or_return TEXT NOT NULL,
  company_paid_costs TEXT NOT NULL,
  lines_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS domestic_diet_rate (
  id TEXT PRIMARY KEY,
  amount_pln TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  source TEXT NOT NULL,
  approved INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS foreign_diet_rate (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  currency TEXT NOT NULL,
  diet_amount TEXT NOT NULL,
  lodging_limit TEXT,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  source TEXT NOT NULL,
  approved INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS mileage_rate (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  amount_pln_per_km TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  source TEXT NOT NULL,
  approved INTEGER NOT NULL DEFAULT 1,
  is_statutory INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS exchange_rate (
  id TEXT PRIMARY KEY,
  currency TEXT NOT NULL,
  rate TEXT NOT NULL,
  table_no TEXT,
  effective_date TEXT NOT NULL,
  published_at TEXT,
  kind TEXT NOT NULL,
  source TEXT NOT NULL,
  basis TEXT
);

CREATE TABLE IF NOT EXISTS rate_set_version (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  source TEXT NOT NULL,
  approved_at TEXT,
  approved_by TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'light',
  locale TEXT NOT NULL DEFAULT 'pl',
  map_provider TEXT NOT NULL DEFAULT 'manual',
  map_api_key TEXT,
  routing_server_url TEXT,
  nbp_enabled INTEGER NOT NULL DEFAULT 1,
  min_windows_version TEXT NOT NULL DEFAULT '10',
  min_macos_version TEXT NOT NULL DEFAULT '14',
  last_backup_at TEXT
);
`;
