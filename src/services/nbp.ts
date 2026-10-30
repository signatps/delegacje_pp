import { v4 as uuid } from "uuid";
import type { ExchangeRate } from "../domain/types";
import { upsertExchangeRate } from "../data/repository";
import { moneyFixed } from "../domain/money";

export interface NbpRateRow {
  currency: string;
  code: string;
  mid: number;
}

export interface NbpTable {
  table: string;
  no: string;
  effectiveDate: string;
  rates: NbpRateRow[];
}

/**
 * Official NBP HTTPS API. Offline fallback: caller keeps previously stored rates.
 * Does not silently substitute "today" when a historical date is missing.
 */
export async function fetchNbpTableA(date?: string): Promise<NbpTable> {
  const path = date ? `exchangerates/tables/A/${date}/` : `exchangerates/tables/A/`;
  const url = `https://api.nbp.pl/api/${path}?format=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `NBP API zwróciło ${res.status}. Brak kursu dla wskazanej daty — wprowadź kurs ręcznie z uzasadnieniem lub skieruj do księgowości.`,
    );
  }
  const data = (await res.json()) as NbpTable[];
  const table = Array.isArray(data) ? data[0] : (data as unknown as NbpTable);
  if (!table?.rates?.length) throw new Error("Pusta odpowiedź NBP.");
  return table;
}

export async function importNbpTableA(date?: string): Promise<ExchangeRate[]> {
  const table = await fetchNbpTableA(date);
  const saved: ExchangeRate[] = [];
  for (const row of table.rates) {
    const rate: ExchangeRate = {
      id: uuid(),
      currency: row.code,
      rate: moneyFixed(row.mid, 4),
      tableNo: table.no,
      effectiveDate: table.effectiveDate,
      publishedAt: new Date().toISOString(),
      kind: "A",
      source: "NBP API https://api.nbp.pl/api/",
      basis: `Tabela ${table.table} nr ${table.no}`,
    };
    await upsertExchangeRate(rate);
    saved.push(rate);
  }
  return saved;
}

export async function saveManualRate(input: {
  currency: string;
  rate: string;
  effectiveDate: string;
  basis: string;
  tableNo?: string;
}) {
  if (!input.basis.trim()) {
    throw new Error("Ręczny kurs wymaga uzasadnienia i źródła.");
  }
  const rate: ExchangeRate = {
    id: uuid(),
    currency: input.currency.toUpperCase(),
    rate: moneyFixed(input.rate, 4),
    tableNo: input.tableNo ?? null,
    effectiveDate: input.effectiveDate,
    publishedAt: new Date().toISOString(),
    kind: "manual",
    source: "manual",
    basis: input.basis,
  };
  await upsertExchangeRate(rate);
  return rate;
}
