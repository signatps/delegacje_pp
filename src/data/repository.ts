import { v4 as uuid } from "uuid";
import type {
  Advance,
  AppSettings,
  AppUser,
  AttachmentMeta,
  AuditLogEntry,
  BusinessTrip,
  Company,
  DomesticDietRate,
  Employee,
  ExchangeRate,
  Expense,
  ForeignDietRate,
  MileageRate,
  Settlement,
  TripStatus,
  Vehicle,
} from "../domain/types";
import { all, get, getDb, run } from "./db";

const now = () => new Date().toISOString();

function bool(v: unknown) {
  return v === 1 || v === true;
}

export async function getCompany(): Promise<Company> {
  const db = await getDb();
  const row = get<Record<string, unknown>>(db, `SELECT * FROM company LIMIT 1`);
  if (!row) throw new Error("Brak danych firmy");
  return mapCompany(row);
}

export async function updateCompany(patch: Partial<Company>) {
  const current = await getCompany();
  const next = { ...current, ...patch, updatedAt: now() };
  const db = await getDb();
  run(
    db,
    `UPDATE company SET name=?, nip=?, address=?, city=?, postal_code=?, logo_data_url=?, trip_number_prefix=?, trip_number_next=?, simplify_workflow=?, updated_at=? WHERE id=?`,
    [
      next.name,
      next.nip,
      next.address,
      next.city,
      next.postalCode,
      next.logoDataUrl,
      next.tripNumberPrefix,
      next.tripNumberNext,
      next.simplifyWorkflow ? 1 : 0,
      next.updatedAt,
      next.id,
    ],
  );
  await audit("admin", "update", "company", next.id, "Aktualizacja danych firmy");
  return next;
}

function mapCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name),
    nip: (row.nip as string) ?? null,
    address: (row.address as string) ?? null,
    city: (row.city as string) ?? null,
    postalCode: (row.postal_code as string) ?? null,
    logoDataUrl: (row.logo_data_url as string) ?? null,
    tripNumberPrefix: String(row.trip_number_prefix),
    tripNumberNext: Number(row.trip_number_next),
    simplifyWorkflow: bool(row.simplify_workflow),
    updatedAt: String(row.updated_at),
  };
}

export async function listEmployees(query = ""): Promise<Employee[]> {
  const db = await getDb();
  const q = `%${query.trim()}%`;
  const rows = all<Record<string, unknown>>(
    db,
    `SELECT * FROM employee
     WHERE (? = '%%') OR first_name LIKE ? OR last_name LIKE ? OR employee_number LIKE ? OR department LIKE ? OR email LIKE ?
     ORDER BY last_name, first_name`,
    [q, q, q, q, q, q],
  );
  return rows.map(mapEmployee);
}

function mapEmployee(row: Record<string, unknown>): Employee {
  return {
    id: String(row.id),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    employeeNumber: String(row.employee_number),
    position: (row.position as string) ?? null,
    department: (row.department as string) ?? null,
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    workplace: (row.workplace as string) ?? null,
    residenceCity: (row.residence_city as string) ?? null,
    bankAccount: (row.bank_account as string) ?? null,
    managerId: (row.manager_id as string) ?? null,
    status: row.status as Employee["status"],
    notes: (row.notes as string) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function upsertEmployee(
  input: Omit<Employee, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const db = await getDb();
  const t = now();
  const id = input.id ?? uuid();
  const existing = get(db, `SELECT id FROM employee WHERE id=?`, [id]);
  if (existing) {
    run(
      db,
      `UPDATE employee SET first_name=?, last_name=?, employee_number=?, position=?, department=?, email=?, phone=?, workplace=?, residence_city=?, bank_account=?, manager_id=?, status=?, notes=?, updated_at=? WHERE id=?`,
      [
        input.firstName,
        input.lastName,
        input.employeeNumber,
        input.position,
        input.department,
        input.email,
        input.phone,
        input.workplace,
        input.residenceCity,
        input.bankAccount,
        input.managerId,
        input.status,
        input.notes,
        t,
        id,
      ],
    );
    await audit("admin", "update", "employee", id, `${input.firstName} ${input.lastName}`);
  } else {
    run(
      db,
      `INSERT INTO employee(id, first_name, last_name, employee_number, position, department, email, phone, workplace, residence_city, bank_account, manager_id, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.firstName,
        input.lastName,
        input.employeeNumber,
        input.position,
        input.department,
        input.email,
        input.phone,
        input.workplace,
        input.residenceCity,
        input.bankAccount,
        input.managerId,
        input.status,
        input.notes,
        t,
        t,
      ],
    );
    await audit("admin", "create", "employee", id, `${input.firstName} ${input.lastName}`);
  }
  return (await listEmployees()).find((e) => e.id === id)!;
}

export async function findEmployeeDuplicates(firstName: string, lastName: string) {
  const db = await getDb();
  return all<Record<string, unknown>>(
    db,
    `SELECT id, first_name, last_name, employee_number FROM employee
     WHERE lower(first_name)=lower(?) AND lower(last_name)=lower(?)`,
    [firstName, lastName],
  ).map(mapEmployee);
}

export async function listVehicles(): Promise<Vehicle[]> {
  const db = await getDb();
  return all<Record<string, unknown>>(db, `SELECT * FROM vehicle ORDER BY plate_number`).map(mapVehicle);
}

function mapVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: String(row.id),
    kind: row.kind as Vehicle["kind"],
    ownerEmployeeId: (row.owner_employee_id as string) ?? null,
    brand: String(row.brand),
    model: String(row.model),
    plateNumber: String(row.plate_number),
    fuelType: row.fuel_type as Vehicle["fuelType"],
    engineCapacityCcm: row.engine_capacity_ccm == null ? null : Number(row.engine_capacity_ccm),
    engineCategory: row.engine_category as Vehicle["engineCategory"],
    customMileageRate: (row.custom_mileage_rate as string) ?? null,
    customRateBasis: (row.custom_rate_basis as string) ?? null,
    needsAccountingReview: bool(row.needs_accounting_review),
    usageForm: (row.usage_form as Vehicle["usageForm"]) ?? null,
    defaultUserId: (row.default_user_id as string) ?? null,
    employerConsent: bool(row.employer_consent),
    status: row.status as Vehicle["status"],
    notes: (row.notes as string) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function upsertVehicle(input: Omit<Vehicle, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const db = await getDb();
  const t = now();
  const id = input.id ?? uuid();
  const existing = get(db, `SELECT id FROM vehicle WHERE id=?`, [id]);
  const params = [
    input.kind,
    input.ownerEmployeeId,
    input.brand,
    input.model,
    input.plateNumber,
    input.fuelType,
    input.engineCapacityCcm,
    input.engineCategory,
    input.customMileageRate,
    input.customRateBasis,
    input.needsAccountingReview ? 1 : 0,
    input.usageForm,
    input.defaultUserId,
    input.employerConsent ? 1 : 0,
    input.status,
    input.notes,
    t,
  ];
  if (existing) {
    run(
      db,
      `UPDATE vehicle SET kind=?, owner_employee_id=?, brand=?, model=?, plate_number=?, fuel_type=?, engine_capacity_ccm=?, engine_category=?, custom_mileage_rate=?, custom_rate_basis=?, needs_accounting_review=?, usage_form=?, default_user_id=?, employer_consent=?, status=?, notes=?, updated_at=? WHERE id=?`,
      [...params, id],
    );
  } else {
    run(
      db,
      `INSERT INTO vehicle(id, kind, owner_employee_id, brand, model, plate_number, fuel_type, engine_capacity_ccm, engine_category, custom_mileage_rate, custom_rate_basis, needs_accounting_review, usage_form, default_user_id, employer_consent, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, ...params.slice(0, -1), t, t],
    );
  }
  await audit("admin", existing ? "update" : "create", "vehicle", id, input.plateNumber);
  return (await listVehicles()).find((v) => v.id === id)!;
}

function mapTrip(row: Record<string, unknown>): BusinessTrip {
  return {
    id: String(row.id),
    number: String(row.number),
    issuedAt: String(row.issued_at),
    employeeId: String(row.employee_id),
    purpose: String(row.purpose),
    description: (row.description as string) ?? null,
    startPlace: String(row.start_place),
    plannedStartAt: String(row.planned_start_at),
    plannedEndAt: String(row.planned_end_at),
    actualStartAt: (row.actual_start_at as string) ?? null,
    actualEndAt: (row.actual_end_at as string) ?? null,
    isForeign: bool(row.is_foreign),
    status: row.status as TripStatus,
    requesterId: (row.requester_id as string) ?? null,
    approverId: (row.approver_id as string) ?? null,
    notes: (row.notes as string) ?? null,
    dietDisabled: bool(row.diet_disabled),
    dietDisabledReason: (row.diet_disabled_reason as string) ?? null,
    destinations: JSON.parse(String(row.destinations_json || "[]")),
    segments: JSON.parse(String(row.segments_json || "[]")),
    meals: JSON.parse(String(row.meals_json || "[]")),
    accommodations: JSON.parse(String(row.accommodations_json || "[]")),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listTrips(): Promise<BusinessTrip[]> {
  const db = await getDb();
  return all<Record<string, unknown>>(db, `SELECT * FROM business_trip ORDER BY planned_start_at DESC`).map(mapTrip);
}

export async function getTrip(id: string) {
  const db = await getDb();
  const row = get<Record<string, unknown>>(db, `SELECT * FROM business_trip WHERE id=?`, [id]);
  return row ? mapTrip(row) : null;
}

export async function nextTripNumber() {
  const company = await getCompany();
  return `${company.tripNumberPrefix}${String(company.tripNumberNext).padStart(4, "0")}`;
}

export async function saveTrip(trip: BusinessTrip, bumpNumber = false) {
  const db = await getDb();
  const t = now();
  const existing = get(db, `SELECT id FROM business_trip WHERE id=?`, [trip.id]);
  const payload = [
    trip.number,
    trip.issuedAt,
    trip.employeeId,
    trip.purpose,
    trip.description,
    trip.startPlace,
    trip.plannedStartAt,
    trip.plannedEndAt,
    trip.actualStartAt,
    trip.actualEndAt,
    trip.isForeign ? 1 : 0,
    trip.status,
    trip.requesterId,
    trip.approverId,
    trip.notes,
    trip.dietDisabled ? 1 : 0,
    trip.dietDisabledReason,
    JSON.stringify(trip.destinations),
    JSON.stringify(trip.segments),
    JSON.stringify(trip.meals),
    JSON.stringify(trip.accommodations),
    t,
  ];
  if (existing) {
    run(
      db,
      `UPDATE business_trip SET number=?, issued_at=?, employee_id=?, purpose=?, description=?, start_place=?, planned_start_at=?, planned_end_at=?, actual_start_at=?, actual_end_at=?, is_foreign=?, status=?, requester_id=?, approver_id=?, notes=?, diet_disabled=?, diet_disabled_reason=?, destinations_json=?, segments_json=?, meals_json=?, accommodations_json=?, updated_at=? WHERE id=?`,
      [...payload, trip.id],
    );
  } else {
    run(
      db,
      `INSERT INTO business_trip(id, number, issued_at, employee_id, purpose, description, start_place, planned_start_at, planned_end_at, actual_start_at, actual_end_at, is_foreign, status, requester_id, approver_id, notes, diet_disabled, diet_disabled_reason, destinations_json, segments_json, meals_json, accommodations_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [trip.id, ...payload.slice(0, -1), t, t],
    );
    if (bumpNumber) {
      const company = await getCompany();
      await updateCompany({ tripNumberNext: company.tripNumberNext + 1 });
    }
  }
  await audit("admin", existing ? "update" : "create", "business_trip", trip.id, `${trip.number} / ${trip.status}`);
  return (await getTrip(trip.id))!;
}

export async function setTripStatus(id: string, status: TripStatus, details: string) {
  const trip = await getTrip(id);
  if (!trip) throw new Error("Nie znaleziono delegacji");
  trip.status = status;
  trip.updatedAt = now();
  await saveTrip(trip);
  await audit("admin", "status_change", "business_trip", id, details);
  return trip;
}

export async function listExpenses(tripId?: string): Promise<Expense[]> {
  const db = await getDb();
  const rows = tripId
    ? all<Record<string, unknown>>(db, `SELECT * FROM expense WHERE trip_id=? ORDER BY date DESC`, [tripId])
    : all<Record<string, unknown>>(db, `SELECT * FROM expense ORDER BY date DESC`);
  return rows.map(mapExpense);
}

function mapExpense(row: Record<string, unknown>): Expense {
  return {
    id: String(row.id),
    tripId: (row.trip_id as string) ?? null,
    date: String(row.date),
    category: String(row.category),
    description: String(row.description),
    amount: String(row.amount),
    currency: String(row.currency),
    countryCode: (row.country_code as string) ?? null,
    vendor: (row.vendor as string) ?? null,
    documentNumber: (row.document_number as string) ?? null,
    vatAmount: (row.vat_amount as string) ?? null,
    paymentMethod: (row.payment_method as string) ?? null,
    paidBy: row.paid_by as Expense["paidBy"],
    refundAmount: String(row.refund_amount),
    accepted: bool(row.accepted),
    comment: (row.comment as string) ?? null,
    withoutReceipt: bool(row.without_receipt),
    withoutReceiptStatement: (row.without_receipt_statement as string) ?? null,
    attachmentIds: JSON.parse(String(row.attachment_ids_json || "[]")),
    createdAt: String(row.created_at),
  };
}

export async function saveExpense(expense: Expense) {
  const db = await getDb();
  const existing = get(db, `SELECT id FROM expense WHERE id=?`, [expense.id]);
  const params = [
    expense.tripId,
    expense.date,
    expense.category,
    expense.description,
    expense.amount,
    expense.currency,
    expense.countryCode,
    expense.vendor,
    expense.documentNumber,
    expense.vatAmount,
    expense.paymentMethod,
    expense.paidBy,
    expense.refundAmount,
    expense.accepted ? 1 : 0,
    expense.comment,
    expense.withoutReceipt ? 1 : 0,
    expense.withoutReceiptStatement,
    JSON.stringify(expense.attachmentIds),
  ];
  if (existing) {
    run(
      db,
      `UPDATE expense SET trip_id=?, date=?, category=?, description=?, amount=?, currency=?, country_code=?, vendor=?, document_number=?, vat_amount=?, payment_method=?, paid_by=?, refund_amount=?, accepted=?, comment=?, without_receipt=?, without_receipt_statement=?, attachment_ids_json=? WHERE id=?`,
      [...params, expense.id],
    );
  } else {
    run(
      db,
      `INSERT INTO expense(id, trip_id, date, category, description, amount, currency, country_code, vendor, document_number, vat_amount, payment_method, paid_by, refund_amount, accepted, comment, without_receipt, without_receipt_statement, attachment_ids_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [expense.id, ...params, expense.createdAt],
    );
  }
  await audit("admin", existing ? "update" : "create", "expense", expense.id, `${expense.amount} ${expense.currency}`);
  return expense;
}

export async function saveAttachment(att: AttachmentMeta) {
  const db = await getDb();
  run(
    db,
    `INSERT OR REPLACE INTO attachment(id, expense_id, file_name, mime_type, size_bytes, checksum_sha256, data_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [att.id, att.expenseId, att.fileName, att.mimeType, att.sizeBytes, att.checksumSha256, att.dataUrl, att.createdAt],
  );
  return att;
}

export async function getAttachment(id: string) {
  const db = await getDb();
  const row = get<Record<string, unknown>>(db, `SELECT * FROM attachment WHERE id=?`, [id]);
  if (!row) return null;
  return {
    id: String(row.id),
    expenseId: (row.expense_id as string) ?? null,
    fileName: String(row.file_name),
    mimeType: String(row.mime_type),
    sizeBytes: Number(row.size_bytes),
    checksumSha256: String(row.checksum_sha256),
    dataUrl: String(row.data_url),
    createdAt: String(row.created_at),
  } satisfies AttachmentMeta;
}

export async function listAdvances(tripId?: string): Promise<Advance[]> {
  const db = await getDb();
  const rows = tripId
    ? all<Record<string, unknown>>(db, `SELECT * FROM advance WHERE trip_id=? ORDER BY created_at DESC`, [tripId])
    : all<Record<string, unknown>>(db, `SELECT * FROM advance ORDER BY created_at DESC`);
  return rows.map((row) => ({
    id: String(row.id),
    tripId: String(row.trip_id),
    requestedAmount: String(row.requested_amount),
    currency: String(row.currency),
    status: row.status as Advance["status"],
    approvedAmount: (row.approved_amount as string) ?? null,
    paidAmount: (row.paid_amount as string) ?? null,
    paidAt: (row.paid_at as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: String(row.created_at),
  }));
}

export async function saveAdvance(advance: Advance) {
  const db = await getDb();
  const existing = get(db, `SELECT id FROM advance WHERE id=?`, [advance.id]);
  if (existing) {
    run(
      db,
      `UPDATE advance SET trip_id=?, requested_amount=?, currency=?, status=?, approved_amount=?, paid_amount=?, paid_at=?, notes=? WHERE id=?`,
      [
        advance.tripId,
        advance.requestedAmount,
        advance.currency,
        advance.status,
        advance.approvedAmount,
        advance.paidAmount,
        advance.paidAt,
        advance.notes,
        advance.id,
      ],
    );
  } else {
    run(
      db,
      `INSERT INTO advance(id, trip_id, requested_amount, currency, status, approved_amount, paid_amount, paid_at, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        advance.id,
        advance.tripId,
        advance.requestedAmount,
        advance.currency,
        advance.status,
        advance.approvedAmount,
        advance.paidAmount,
        advance.paidAt,
        advance.notes,
        advance.createdAt,
      ],
    );
  }
  await audit("admin", existing ? "update" : "create", "advance", advance.id, `${advance.status} ${advance.requestedAmount} ${advance.currency}`);
  return advance;
}

export async function saveSettlement(settlement: Settlement) {
  const db = await getDb();
  const existing = get(db, `SELECT id FROM settlement WHERE id=?`, [settlement.id]);
  const params = [
    settlement.tripId,
    settlement.status,
    settlement.dueAt,
    settlement.totalDueBeforeAdvance,
    settlement.advancesPaid,
    settlement.amountToPayOrReturn,
    settlement.companyPaidCosts,
    JSON.stringify(settlement.lines),
    settlement.updatedAt,
  ];
  if (existing) {
    run(
      db,
      `UPDATE settlement SET trip_id=?, status=?, due_at=?, total_due_before_advance=?, advances_paid=?, amount_to_pay_or_return=?, company_paid_costs=?, lines_json=?, updated_at=? WHERE id=?`,
      [...params, settlement.id],
    );
  } else {
    run(
      db,
      `INSERT INTO settlement(id, trip_id, status, due_at, total_due_before_advance, advances_paid, amount_to_pay_or_return, company_paid_costs, lines_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [settlement.id, ...params.slice(0, -1), settlement.createdAt, settlement.updatedAt],
    );
  }
  await audit("admin", existing ? "update" : "create", "settlement", settlement.id, settlement.status);
  return settlement;
}

export async function getSettlementForTrip(tripId: string): Promise<Settlement | null> {
  const db = await getDb();
  const row = get<Record<string, unknown>>(db, `SELECT * FROM settlement WHERE trip_id=?`, [tripId]);
  if (!row) return null;
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    status: row.status as Settlement["status"],
    dueAt: (row.due_at as string) ?? null,
    totalDueBeforeAdvance: String(row.total_due_before_advance),
    advancesPaid: String(row.advances_paid),
    amountToPayOrReturn: String(row.amount_to_pay_or_return),
    companyPaidCosts: String(row.company_paid_costs),
    lines: JSON.parse(String(row.lines_json)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listDomesticRates(): Promise<DomesticDietRate[]> {
  const db = await getDb();
  return all<Record<string, unknown>>(db, `SELECT * FROM domestic_diet_rate ORDER BY valid_from DESC`).map((r) => ({
    id: String(r.id),
    amountPln: String(r.amount_pln),
    validFrom: String(r.valid_from),
    validTo: (r.valid_to as string) ?? null,
    source: String(r.source),
    approved: bool(r.approved),
  }));
}

export async function listForeignRates(): Promise<ForeignDietRate[]> {
  const db = await getDb();
  return all<Record<string, unknown>>(db, `SELECT * FROM foreign_diet_rate ORDER BY country_name`).map((r) => ({
    id: String(r.id),
    countryCode: String(r.country_code),
    countryName: String(r.country_name),
    currency: String(r.currency),
    dietAmount: String(r.diet_amount),
    lodgingLimit: (r.lodging_limit as string) ?? null,
    validFrom: String(r.valid_from),
    validTo: (r.valid_to as string) ?? null,
    source: String(r.source),
    approved: bool(r.approved),
  }));
}

export async function listMileageRates(): Promise<MileageRate[]> {
  const db = await getDb();
  return all<Record<string, unknown>>(db, `SELECT * FROM mileage_rate ORDER BY valid_from DESC`).map((r) => ({
    id: String(r.id),
    category: r.category as MileageRate["category"],
    amountPlnPerKm: String(r.amount_pln_per_km),
    validFrom: String(r.valid_from),
    validTo: (r.valid_to as string) ?? null,
    source: String(r.source),
    approved: bool(r.approved),
    isStatutory: bool(r.is_statutory),
  }));
}

export async function listExchangeRates(): Promise<ExchangeRate[]> {
  const db = await getDb();
  return all<Record<string, unknown>>(db, `SELECT * FROM exchange_rate ORDER BY effective_date DESC, currency`).map(
    (r) => ({
      id: String(r.id),
      currency: String(r.currency),
      rate: String(r.rate),
      tableNo: (r.table_no as string) ?? null,
      effectiveDate: String(r.effective_date),
      publishedAt: (r.published_at as string) ?? null,
      kind: r.kind as ExchangeRate["kind"],
      source: String(r.source),
      basis: (r.basis as string) ?? null,
    }),
  );
}

export async function upsertExchangeRate(rate: ExchangeRate) {
  const db = await getDb();
  run(
    db,
    `INSERT OR REPLACE INTO exchange_rate(id, currency, rate, table_no, effective_date, published_at, kind, source, basis)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [rate.id, rate.currency, rate.rate, rate.tableNo, rate.effectiveDate, rate.publishedAt, rate.kind, rate.source, rate.basis],
  );
  return rate;
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb();
  const row = get<Record<string, unknown>>(db, `SELECT * FROM app_settings WHERE id='default'`);
  if (!row) throw new Error("Brak ustawień");
  return {
    id: "default",
    theme: row.theme as AppSettings["theme"],
    locale: String(row.locale),
    mapProvider: row.map_provider as AppSettings["mapProvider"],
    mapApiKey: (row.map_api_key as string) ?? null,
    routingServerUrl: (row.routing_server_url as string) ?? null,
    nbpEnabled: bool(row.nbp_enabled),
    minWindowsVersion: String(row.min_windows_version),
    minMacosVersion: String(row.min_macos_version),
    lastBackupAt: (row.last_backup_at as string) ?? null,
  };
}

export async function saveSettings(settings: AppSettings) {
  const db = await getDb();
  run(
    db,
    `UPDATE app_settings SET theme=?, locale=?, map_provider=?, map_api_key=?, routing_server_url=?, nbp_enabled=?, min_windows_version=?, min_macos_version=?, last_backup_at=? WHERE id='default'`,
    [
      settings.theme,
      settings.locale,
      settings.mapProvider,
      settings.mapApiKey,
      settings.routingServerUrl,
      settings.nbpEnabled ? 1 : 0,
      settings.minWindowsVersion,
      settings.minMacosVersion,
      settings.lastBackupAt,
    ],
  );
  return settings;
}

export async function listAuditLog(limit = 50): Promise<AuditLogEntry[]> {
  const db = await getDb();
  return all<Record<string, unknown>>(db, `SELECT * FROM audit_log ORDER BY at DESC LIMIT ?`, [limit]).map((r) => ({
    id: String(r.id),
    at: String(r.at),
    actor: String(r.actor),
    action: String(r.action),
    entityType: String(r.entity_type),
    entityId: String(r.entity_id),
    details: String(r.details),
  }));
}

export async function listUsers(): Promise<AppUser[]> {
  const db = await getDb();
  return all<Record<string, unknown>>(db, `SELECT * FROM app_user`).map((r) => ({
    id: String(r.id),
    login: String(r.login),
    displayName: String(r.display_name),
    role: r.role as AppUser["role"],
    employeeId: (r.employee_id as string) ?? null,
    active: bool(r.active),
  }));
}

export async function audit(actor: string, action: string, entityType: string, entityId: string, details: string) {
  const db = await getDb();
  run(db, `INSERT INTO audit_log(id, at, actor, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    uuid(),
    now(),
    actor,
    action,
    entityType,
    entityId,
    details,
  ]);
}

export async function currentDomesticDietRate() {
  const rates = await listDomesticRates();
  return rates.find((r) => r.approved) ?? rates[0] ?? null;
}

export async function currentMileageRate(category: string) {
  const rates = await listMileageRates();
  return rates.find((r) => r.approved && r.category === category) ?? null;
}

export async function latestExchangeMap() {
  const rates = await listExchangeRates();
  const map: Record<string, string> = { PLN: "1" };
  for (const r of rates) {
    if (!map[r.currency]) map[r.currency] = r.rate;
  }
  return map;
}
