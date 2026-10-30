import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getDb } from "../data/db";
import {
  getCompany,
  getSettings,
  listAdvances,
  listEmployees,
  listExchangeRates,
  listExpenses,
  listMileageRates,
  listDomesticRates,
  listForeignRates,
  listTrips,
  listVehicles,
  listAuditLog,
} from "../data/repository";
import type {
  Advance,
  AppSettings,
  AuditLogEntry,
  BusinessTrip,
  Company,
  DomesticDietRate,
  Employee,
  ExchangeRate,
  Expense,
  ForeignDietRate,
  MileageRate,
  Vehicle,
} from "../domain/types";

interface AppDataValue {
  ready: boolean;
  error: string | null;
  online: boolean;
  company: Company | null;
  settings: AppSettings | null;
  employees: Employee[];
  vehicles: Vehicle[];
  trips: BusinessTrip[];
  expenses: Expense[];
  advances: Advance[];
  domesticRates: DomesticDietRate[];
  foreignRates: ForeignDietRate[];
  mileageRates: MileageRate[];
  exchangeRates: ExchangeRate[];
  auditLog: AuditLogEntry[];
  refresh: () => Promise<void>;
}

const Ctx = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [company, setCompany] = useState<Company | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<BusinessTrip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [domesticRates, setDomesticRates] = useState<DomesticDietRate[]>([]);
  const [foreignRates, setForeignRates] = useState<ForeignDietRate[]>([]);
  const [mileageRates, setMileageRates] = useState<MileageRate[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      await getDb();
      const [
        c,
        s,
        emps,
        vehs,
        tr,
        ex,
        adv,
        dr,
        fr,
        mr,
        er,
        audit,
      ] = await Promise.all([
        getCompany(),
        getSettings(),
        listEmployees(),
        listVehicles(),
        listTrips(),
        listExpenses(),
        listAdvances(),
        listDomesticRates(),
        listForeignRates(),
        listMileageRates(),
        listExchangeRates(),
        listAuditLog(30),
      ]);
      setCompany(c);
      setSettings(s);
      setEmployees(emps);
      setVehicles(vehs);
      setTrips(tr);
      setExpenses(ex);
      setAdvances(adv);
      setDomesticRates(dr);
      setForeignRates(fr);
      setMileageRates(mr);
      setExchangeRates(er);
      setAuditLog(audit);
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setReady(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      ready,
      error,
      online,
      company,
      settings,
      employees,
      vehicles,
      trips,
      expenses,
      advances,
      domesticRates,
      foreignRates,
      mileageRates,
      exchangeRates,
      auditLog,
      refresh,
    }),
    [
      ready,
      error,
      online,
      company,
      settings,
      employees,
      vehicles,
      trips,
      expenses,
      advances,
      domesticRates,
      foreignRates,
      mileageRates,
      exchangeRates,
      auditLog,
      refresh,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppData poza providerem");
  return ctx;
}
