export type Role = "administrator" | "manager" | "employee" | "accounting";

export type EmployeeStatus = "active" | "inactive";

export type VehicleKind = "private" | "company";
export type FuelType = "benzyna" | "diesel" | "lpg" | "hybryda" | "elektryczny" | "inny";
export type EngineCategory = "do_900" | "powyzej_900" | "bez_pojemnosci" | "do_weryfikacji";

export type TripStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "planned"
  | "in_progress"
  | "awaiting_settlement"
  | "settlement_draft"
  | "settlement_review"
  | "settlement_accepted"
  | "settlement_returned"
  | "settled"
  | "cancelled";

export type TransportMode =
  | "private_car"
  | "company_car"
  | "rental_car"
  | "train"
  | "plane"
  | "bus"
  | "ferry"
  | "public_transit"
  | "taxi"
  | "other";

export type AdvanceStatus =
  | "requested"
  | "approved"
  | "paid"
  | "partially_settled"
  | "settled"
  | "cancelled";

export type ExpenseBearer = "employee" | "company" | "company_card" | "advance" | "other";

export interface Company {
  id: string;
  name: string;
  nip: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  logoDataUrl: string | null;
  tripNumberPrefix: string;
  tripNumberNext: number;
  simplifyWorkflow: boolean;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  login: string;
  displayName: string;
  role: Role;
  employeeId: string | null;
  active: boolean;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  position: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  workplace: string | null;
  residenceCity: string | null;
  bankAccount: string | null;
  managerId: string | null;
  status: EmployeeStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  kind: VehicleKind;
  ownerEmployeeId: string | null;
  brand: string;
  model: string;
  plateNumber: string;
  fuelType: FuelType;
  engineCapacityCcm: number | null;
  engineCategory: EngineCategory;
  customMileageRate: string | null;
  customRateBasis: string | null;
  needsAccountingReview: boolean;
  usageForm: "ownership" | "leasing" | "rental" | null;
  defaultUserId: string | null;
  employerConsent: boolean;
  status: EmployeeStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripDestination {
  id: string;
  orderIndex: number;
  place: string;
  countryCode: string;
  isTransit: boolean;
  plannedArrivalAt: string | null;
  plannedDepartureAt: string | null;
}

export interface TripSegment {
  id: string;
  orderIndex: number;
  fromPlace: string;
  toPlace: string;
  transportMode: TransportMode;
  vehicleId: string | null;
  plannedDistanceKm: string | null;
  actualDistanceKm: string | null;
  distanceDiffReason: string | null;
  odometerStart: number | null;
  odometerEnd: number | null;
}

export interface MealProvision {
  id: string;
  periodLabel: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  fullBoard: boolean;
  notes: string | null;
}

export interface Accommodation {
  id: string;
  place: string;
  countryCode: string;
  checkInAt: string;
  checkOutAt: string;
  nights: number;
  amount: string;
  currency: string;
  withinLimit: boolean;
  overLimitApproved: boolean;
  overLimitReason: string | null;
  paidBy: ExpenseBearer;
  documentRef: string | null;
  lumpSumWithoutReceipt: boolean;
  statement: string | null;
}

export interface Expense {
  id: string;
  tripId: string | null;
  date: string;
  category: string;
  description: string;
  amount: string;
  currency: string;
  countryCode: string | null;
  vendor: string | null;
  documentNumber: string | null;
  vatAmount: string | null;
  paymentMethod: string | null;
  paidBy: ExpenseBearer;
  refundAmount: string;
  accepted: boolean;
  comment: string | null;
  withoutReceipt: boolean;
  withoutReceiptStatement: string | null;
  attachmentIds: string[];
  createdAt: string;
}

export interface AttachmentMeta {
  id: string;
  expenseId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  dataUrl: string;
  createdAt: string;
}

export interface Advance {
  id: string;
  tripId: string;
  requestedAmount: string;
  currency: string;
  status: AdvanceStatus;
  approvedAmount: string | null;
  paidAmount: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SettlementLine {
  id: string;
  kind: "domestic_diet" | "foreign_diet" | "mileage" | "expense" | "accommodation" | "advance" | "correction" | "other";
  label: string;
  amount: string;
  currency: string;
  amountPln: string;
  explanation: string;
  rateVersionId: string | null;
  originalAmount: string | null;
  correctionReason: string | null;
}

export interface Settlement {
  id: string;
  tripId: string;
  status: "draft" | "review" | "accepted" | "returned" | "settled";
  dueAt: string | null;
  totalDueBeforeAdvance: string;
  advancesPaid: string;
  amountToPayOrReturn: string;
  companyPaidCosts: string;
  lines: SettlementLine[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessTrip {
  id: string;
  number: string;
  issuedAt: string;
  employeeId: string;
  purpose: string;
  description: string | null;
  startPlace: string;
  plannedStartAt: string;
  plannedEndAt: string;
  actualStartAt: string | null;
  actualEndAt: string | null;
  isForeign: boolean;
  status: TripStatus;
  requesterId: string | null;
  approverId: string | null;
  notes: string | null;
  dietDisabled: boolean;
  dietDisabledReason: string | null;
  destinations: TripDestination[];
  segments: TripSegment[];
  meals: MealProvision[];
  accommodations: Accommodation[];
  createdAt: string;
  updatedAt: string;
}

export interface DomesticDietRate {
  id: string;
  amountPln: string;
  validFrom: string;
  validTo: string | null;
  source: string;
  approved: boolean;
}

export interface ForeignDietRate {
  id: string;
  countryCode: string;
  countryName: string;
  currency: string;
  dietAmount: string;
  lodgingLimit: string | null;
  validFrom: string;
  validTo: string | null;
  source: string;
  approved: boolean;
}

export interface MileageRate {
  id: string;
  category: EngineCategory;
  amountPlnPerKm: string;
  validFrom: string;
  validTo: string | null;
  source: string;
  approved: boolean;
  isStatutory: boolean;
}

export interface ExchangeRate {
  id: string;
  currency: string;
  rate: string;
  tableNo: string | null;
  effectiveDate: string;
  publishedAt: string | null;
  kind: "A" | "B" | "C" | "manual";
  source: string;
  basis: string | null;
}

export interface RateSetVersion {
  id: string;
  label: string;
  effectiveFrom: string;
  source: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface AuditLogEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}

export interface AppSettings {
  id: string;
  theme: "light" | "dark" | "system";
  locale: string;
  mapProvider: "manual" | "osm";
  mapApiKey: string | null;
  routingServerUrl: string | null;
  nbpEnabled: boolean;
  minWindowsVersion: string;
  minMacosVersion: string;
  lastBackupAt: string | null;
}

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  draft: "Wersja robocza",
  pending_approval: "Do zatwierdzenia",
  approved: "Zatwierdzona",
  rejected: "Odrzucona",
  planned: "Zaplanowana",
  in_progress: "W trakcie",
  awaiting_settlement: "Do rozliczenia",
  settlement_draft: "Rozliczenie w przygotowaniu",
  settlement_review: "Do weryfikacji",
  settlement_accepted: "Zaakceptowane",
  settlement_returned: "Zwrócone do poprawy",
  settled: "Rozliczona",
  cancelled: "Anulowana",
};

export const TRANSPORT_LABELS: Record<TransportMode, string> = {
  private_car: "Samochód prywatny",
  company_car: "Samochód służbowy",
  rental_car: "Samochód wynajęty",
  train: "Kolej",
  plane: "Samolot",
  bus: "Autobus",
  ferry: "Prom",
  public_transit: "Transport publiczny",
  taxi: "Taksi",
  other: "Inny",
};

export const EXPENSE_CATEGORIES = [
  "hotel",
  "wyzywienie",
  "bilet_kolejowy",
  "bilet_lotniczy",
  "bilet_autobusowy",
  "transport_publiczny",
  "taksowka",
  "wynajem",
  "paliwo",
  "ladowanie",
  "parking",
  "autostrada",
  "winieta",
  "prom",
  "konferencja",
  "bagaz",
  "inne",
] as const;
