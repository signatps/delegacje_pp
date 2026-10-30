import type { Database } from "sql.js";
import { v4 as uuid } from "uuid";
import { BRAND } from "../branding";

const now = () => new Date().toISOString();

export function seedIfEmpty(db: Database) {
  const row = db.exec(`SELECT COUNT(*) as c FROM company`);
  const count = (row[0]?.values?.[0]?.[0] as number) ?? 0;
  if (count > 0) return;

  const companyId = uuid();
  const adminId = uuid();
  const emp1 = uuid();
  const emp2 = uuid();
  const emp3 = uuid();
  const t = now();

  db.run(
    `INSERT INTO company(id, name, nip, address, city, postal_code, logo_data_url, trip_number_prefix, trip_number_next, simplify_workflow, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)`,
    [
      companyId,
      BRAND.companyLegalName,
      BRAND.nip,
      BRAND.address,
      BRAND.city,
      BRAND.postalCode,
      BRAND.logoPath,
      BRAND.tripNumberPrefix,
      t,
    ],
  );

  db.run(
    `INSERT INTO app_user(id, login, display_name, role, employee_id, active) VALUES (?, 'admin', 'Administrator', 'administrator', NULL, 1)`,
    [adminId],
  );

  const employees = [
    [emp1, "Anna", "Kowalska", "E-001", "Specjalista ds. sprzedaży", "Sprzedaż", "anna.kowalska@firma.pl", "Warszawa", "Warszawa"],
    [emp2, "Piotr", "Nowak", "E-002", "Kierownik projektu", "IT", "piotr.nowak@firma.pl", "Warszawa", "Warszawa"],
    [emp3, "Maria", "Wiśniewska", "E-003", "Księgowa", "Finanse", "maria.wisniewska@firma.pl", "Kraków", "Kraków"],
  ] as const;

  for (const e of employees) {
    db.run(
      `INSERT INTO employee(id, first_name, last_name, employee_number, position, department, email, phone, workplace, residence_city, bank_account, manager_id, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL, NULL, 'active', NULL, ?, ?)`,
      [...e, t, t],
    );
  }

  const vPrivate = uuid();
  const vCompany = uuid();
  db.run(
    `INSERT INTO vehicle(id, kind, owner_employee_id, brand, model, plate_number, fuel_type, engine_capacity_ccm, engine_category, custom_mileage_rate, custom_rate_basis, needs_accounting_review, usage_form, default_user_id, employer_consent, status, notes, created_at, updated_at)
     VALUES (?, 'private', ?, 'Toyota', 'Corolla', 'WA12345', 'benzyna', 1598, 'powyzej_900', NULL, NULL, 0, NULL, NULL, 1, 'active', NULL, ?, ?)`,
    [vPrivate, emp1, t, t],
  );
  db.run(
    `INSERT INTO vehicle(id, kind, owner_employee_id, brand, model, plate_number, fuel_type, engine_capacity_ccm, engine_category, custom_mileage_rate, custom_rate_basis, needs_accounting_review, usage_form, default_user_id, employer_consent, status, notes, created_at, updated_at)
     VALUES (?, 'company', NULL, 'Skoda', 'Octavia', 'WI98765', 'diesel', 1968, 'powyzej_900', NULL, NULL, 0, 'leasing', ?, 1, 'active', NULL, ?, ?)`,
    [vCompany, emp2, t, t],
  );

  // Rates verified against spec baseline (must be re-checked vs current law before production use)
  db.run(
    `INSERT INTO domestic_diet_rate(id, amount_pln, valid_from, valid_to, source, approved)
     VALUES (?, '45.00', '2023-01-01', NULL, 'Rozporządzenie MRPiPS — weryfikacja wymagana przed produkcją', 1)`,
    [uuid()],
  );
  db.run(
    `INSERT INTO mileage_rate(id, category, amount_pln_per_km, valid_from, valid_to, source, approved, is_statutory)
     VALUES (?, 'do_900', '0.89', '2023-01-17', NULL, 'MF — stawki km od 17.01.2023 (weryfikacja wymagana)', 1, 1)`,
    [uuid()],
  );
  db.run(
    `INSERT INTO mileage_rate(id, category, amount_pln_per_km, valid_from, valid_to, source, approved, is_statutory)
     VALUES (?, 'powyzej_900', '1.15', '2023-01-17', NULL, 'MF — stawki km od 17.01.2023 (weryfikacja wymagana)', 1, 1)`,
    [uuid()],
  );

  const foreignRates: Array<[string, string, string, string, string]> = [
    ["BG", "Bułgaria", "EUR", "50.00", "120.00"],
    ["DE", "Niemcy", "EUR", "49.00", "150.00"],
    ["US", "Stany Zjednoczone", "USD", "59.00", "200.00"],
    ["GB", "Wielka Brytania", "GBP", "45.00", "180.00"],
  ];
  for (const [code, name, cur, diet, lodge] of foreignRates) {
    db.run(
      `INSERT INTO foreign_diet_rate(id, country_code, country_name, currency, diet_amount, lodging_limit, valid_from, valid_to, source, approved)
       VALUES (?, ?, ?, ?, ?, ?, '2023-01-01', NULL, 'Tabela diet zagranicznych — weryfikacja wymagana', 1)`,
      [uuid(), code, name, cur, diet, lodge],
    );
  }

  db.run(
    `INSERT INTO rate_set_version(id, label, effective_from, source, approved_at, approved_by)
     VALUES (?, 'Zestaw początkowy 2023+', '2023-01-17', 'Seed aplikacji — wymaga potwierdzenia księgowości', ?, 'system')`,
    [uuid(), t],
  );

  db.run(
    `INSERT INTO exchange_rate(id, currency, rate, table_no, effective_date, published_at, kind, source, basis)
     VALUES (?, 'EUR', '4.3000', 'SEED', date('now'), ?, 'A', 'seed', 'Kurs startowy do czasu pobrania z NBP')`,
    [uuid(), t],
  );
  db.run(
    `INSERT INTO exchange_rate(id, currency, rate, table_no, effective_date, published_at, kind, source, basis)
     VALUES (?, 'USD', '3.9500', 'SEED', date('now'), ?, 'A', 'seed', 'Kurs startowy do czasu pobrania z NBP')`,
    [uuid(), t],
  );
  db.run(
    `INSERT INTO exchange_rate(id, currency, rate, table_no, effective_date, published_at, kind, source, basis)
     VALUES (?, 'GBP', '5.1000', 'SEED', date('now'), ?, 'A', 'seed', 'Kurs startowy do czasu pobrania z NBP')`,
    [uuid(), t],
  );

  db.run(
    `INSERT INTO app_settings(id, theme, locale, map_provider, map_api_key, routing_server_url, nbp_enabled, min_windows_version, min_macos_version, last_backup_at)
     VALUES ('default', 'light', 'pl', 'osm', NULL, NULL, 1, '10', '14', NULL)`,
  );

  db.run(
    `INSERT INTO audit_log(id, at, actor, action, entity_type, entity_id, details)
     VALUES (?, ?, 'system', 'seed', 'database', 'v1', 'Utworzono bazę początkową z danymi demonstracyjnymi do usunięcia.')`,
    [uuid(), t],
  );
}
