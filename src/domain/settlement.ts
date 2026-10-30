import type { Advance, Expense, SettlementLine } from "./types";
import { calculateDomesticDiet, hoursBetween } from "./dietDomestic";
import { calculateForeignDiet } from "./dietForeign";
import { calculateMileage } from "./mileage";
import { money, moneyAdd, moneyFixed, moneyMul } from "./money";
import { v4 as uuid } from "uuid";

export interface SettlementCalcInput {
  tripId: string;
  actualStartAt: string;
  actualEndAt: string;
  isForeign: boolean;
  foreignStartAt?: string | null;
  foreignEndAt?: string | null;
  foreignCurrency?: string;
  foreignDietRate?: string;
  domesticDietRatePln: string;
  breakfastCount?: number;
  lunchCount?: number;
  dinnerCount?: number;
  dietDisabled?: boolean;
  mileage?: {
    acceptedKm: string;
    ratePlnPerKm: string;
    vehicleKind: "private" | "company";
    engineCategory: import("./types").EngineCategory;
    customRate?: string | null;
    customRateBasis?: string | null;
  } | null;
  expenses: Expense[];
  advances: Advance[];
  exchangeRates: Record<string, string>;
  dueDays?: number;
}

function toPln(amount: string, currency: string, rates: Record<string, string>): string {
  if (currency === "PLN") return moneyFixed(amount);
  const rate = rates[currency];
  if (!rate) {
    throw new Error(`Brak kursu dla waluty ${currency}. Uzupełnij kurs (NBP lub ręcznie) albo skieruj do księgowości.`);
  }
  return moneyFixed(moneyMul(amount, rate));
}

export function calculateSettlement(input: SettlementCalcInput) {
  const lines: SettlementLine[] = [];
  const domesticHours = hoursBetween(input.actualStartAt, input.actualEndAt);

  if (!input.isForeign) {
    const diet = calculateDomesticDiet({
      durationHours: domesticHours,
      fullDietPln: input.domesticDietRatePln,
      breakfastCount: input.breakfastCount,
      lunchCount: input.lunchCount,
      dinnerCount: input.dinnerCount,
      disabled: input.dietDisabled,
    });
    lines.push({
      id: uuid(),
      kind: "domestic_diet",
      label: "Dieta krajowa",
      amount: diet.netAmount,
      currency: "PLN",
      amountPln: diet.netAmount,
      explanation: diet.explanation,
      rateVersionId: null,
      originalAmount: null,
      correctionReason: null,
    });
  } else {
    const foreignStart = input.foreignStartAt ?? input.actualStartAt;
    const foreignEnd = input.foreignEndAt ?? input.actualEndAt;
    const foreignHours = hoursBetween(foreignStart, foreignEnd);
    const domesticPartHours = Math.max(0, domesticHours - foreignHours);

    if (domesticPartHours > 0) {
      const diet = calculateDomesticDiet({
        durationHours: domesticPartHours,
        fullDietPln: input.domesticDietRatePln,
        breakfastCount: 0,
        lunchCount: 0,
        dinnerCount: 0,
        disabled: input.dietDisabled,
      });
      lines.push({
        id: uuid(),
        kind: "domestic_diet",
        label: "Dieta krajowa (część dojazdu)",
        amount: diet.netAmount,
        currency: "PLN",
        amountPln: diet.netAmount,
        explanation: diet.explanation,
        rateVersionId: null,
        originalAmount: null,
        correctionReason: null,
      });
    }

    const foreign = calculateForeignDiet({
      durationHours: foreignHours,
      fullDietAmount: input.foreignDietRate ?? "0",
      currency: input.foreignCurrency ?? "EUR",
      breakfastCount: input.breakfastCount,
      lunchCount: input.lunchCount,
      dinnerCount: input.dinnerCount,
      disabled: input.dietDisabled,
    });
    const foreignPln = toPln(foreign.netAmount, foreign.currency, input.exchangeRates);
    lines.push({
      id: uuid(),
      kind: "foreign_diet",
      label: `Dieta zagraniczna (${foreign.currency})`,
      amount: foreign.netAmount,
      currency: foreign.currency,
      amountPln: foreignPln,
      explanation: `${foreign.explanation} Przeliczenie: ${foreign.netAmount} ${foreign.currency} × kurs ${input.exchangeRates[foreign.currency] ?? "?"} = ${foreignPln} PLN.`,
      rateVersionId: null,
      originalAmount: null,
      correctionReason: null,
    });
  }

  if (input.mileage) {
    const m = calculateMileage(input.mileage);
    if (m.reimbursable) {
      lines.push({
        id: uuid(),
        kind: "mileage",
        label: "Kilometrówka",
        amount: m.amountPln,
        currency: "PLN",
        amountPln: m.amountPln,
        explanation: m.explanation + (m.warning ? ` Ostrzeżenie: ${m.warning}` : ""),
        rateVersionId: null,
        originalAmount: null,
        correctionReason: null,
      });
    }
  }

  let companyPaid = money(0);
  for (const expense of input.expenses) {
    if (!expense.accepted) continue;
    if (expense.paidBy === "company" || expense.paidBy === "company_card") {
      const pln = toPln(expense.amount, expense.currency, input.exchangeRates);
      companyPaid = companyPaid.plus(pln);
      lines.push({
        id: uuid(),
        kind: "expense",
        label: `Koszt firmy: ${expense.category} — ${expense.description}`,
        amount: expense.amount,
        currency: expense.currency,
        amountPln: pln,
        explanation: `Koszt poniesiony przez firmę — nie zwiększa zwrotu dla pracownika. ${pln} PLN.`,
        rateVersionId: null,
        originalAmount: null,
        correctionReason: null,
      });
      continue;
    }
    const refund = expense.refundAmount || expense.amount;
    const pln = toPln(refund, expense.currency, input.exchangeRates);
    lines.push({
      id: uuid(),
      kind: "expense",
      label: `${expense.category} — ${expense.description}`,
      amount: refund,
      currency: expense.currency,
      amountPln: pln,
      explanation: `Zwrot kosztu pracownika: ${refund} ${expense.currency} → ${pln} PLN.`,
      rateVersionId: null,
      originalAmount: null,
      correctionReason: null,
    });
  }

  const dueBeforeAdvance = lines
    .filter((l) => l.kind !== "expense" || !l.label.startsWith("Koszt firmy:"))
    .reduce((acc, l) => acc.plus(l.amountPln), money(0));

  // Recalculate employee-due properly
  const employeeDue = lines
    .filter((l) => !(l.kind === "expense" && l.label.startsWith("Koszt firmy:")))
    .reduce((acc, l) => acc.plus(l.amountPln), money(0));

  const advancesPaid = input.advances
    .filter((a) => a.status === "paid" || a.status === "partially_settled" || a.status === "settled")
    .reduce((acc, a) => acc.plus(a.paidAmount ?? 0), money(0));

  // unpaid approved advances are NOT treated as transferred
  const amountToPayOrReturn = employeeDue.minus(advancesPaid);

  for (const a of input.advances.filter((x) => x.status === "paid" || x.status === "partially_settled" || x.status === "settled")) {
    lines.push({
      id: uuid(),
      kind: "advance",
      label: `Zaliczka wypłacona (${a.currency})`,
      amount: a.paidAmount ?? "0",
      currency: a.currency,
      amountPln: moneyFixed(a.paidAmount ?? 0),
      explanation: `Zaliczka wypłacona ${a.paidAt ?? "—"}. Status: ${a.status}. Niewypłaconej zaliczki nie traktuje się jako przekazanej.`,
      rateVersionId: null,
      originalAmount: null,
      correctionReason: null,
    });
  }

  const end = new Date(input.actualEndAt);
  const due = new Date(end);
  due.setDate(due.getDate() + (input.dueDays ?? 14));

  return {
    lines,
    totalDueBeforeAdvance: moneyFixed(employeeDue),
    advancesPaid: moneyFixed(advancesPaid),
    amountToPayOrReturn: moneyFixed(amountToPayOrReturn),
    companyPaidCosts: moneyFixed(companyPaid),
    dueAt: due.toISOString(),
    summaryExplanation: [
      `Należność przed zaliczką: ${moneyFixed(employeeDue)} PLN.`,
      `Zaliczki wypłacone: ${moneyFixed(advancesPaid)} PLN.`,
      `Do wypłaty/zwrotu: ${moneyFixed(amountToPayOrReturn)} PLN.`,
      `Koszty firmy (poza zwrotem): ${moneyFixed(companyPaid)} PLN.`,
      `Termin rozliczenia (domyślnie 14 dni): ${due.toISOString().slice(0, 10)}.`,
    ].join(" "),
    // silence unused
    _debug: moneyFixed(dueBeforeAdvance),
  };
}

export function sumPln(values: string[]) {
  return moneyFixed(moneyAdd(...values));
}
