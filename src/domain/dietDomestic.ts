import { money, moneyFixed, moneyMax, moneyMul, type MoneyString } from "./money";

export interface DomesticDietInput {
  /** Duration of the trip in hours (exact fractional hours allowed). */
  durationHours: number;
  /** Full domestic diet rate in PLN for the applicable period. */
  fullDietPln: string | number;
  breakfastCount?: number;
  lunchCount?: number;
  dinnerCount?: number;
  /** Override / disable diet with required reason (caller validates reason). */
  disabled?: boolean;
}

export interface DomesticDietBreakdown {
  fullDiets: number;
  halfDiets: number;
  grossAmount: MoneyString;
  mealDeduction: MoneyString;
  netAmount: MoneyString;
  explanation: string;
  ruleVersion: "PL-domestic-v1";
}

/**
 * Polish domestic business-trip diet rules (initial implementation):
 * - ≤ 1 day: <8h → 0; 8–12h → 50%; >12h → 100%
 * - > 1 day: each full day 100%; incomplete day ≤8h → 50%, >8h → 100%
 * Boundaries: 8:00, 12:00, 24:00, 32:00 etc. use inclusive lower thresholds
 * where the regulation grants the higher bracket starting at exactly that hour.
 * Meals: breakfast 25%, lunch 50%, dinner 25% of a full diet. Never negative.
 */
export function calculateDomesticDiet(input: DomesticDietInput): DomesticDietBreakdown {
  if (input.disabled) {
    return {
      fullDiets: 0,
      halfDiets: 0,
      grossAmount: "0.00",
      mealDeduction: "0.00",
      netAmount: "0.00",
      explanation: "Dieta wyłączona przez użytkownika (wymagana przyczyna w zleceniu).",
      ruleVersion: "PL-domestic-v1",
    };
  }

  const hours = input.durationHours;
  if (!Number.isFinite(hours) || hours < 0) {
    throw new Error("Czas trwania delegacji krajowej musi być liczbą nieujemną.");
  }

  let fullDiets = 0;
  let halfDiets = 0;

  if (hours <= 24) {
    if (hours < 8) {
      fullDiets = 0;
      halfDiets = 0;
    } else if (hours <= 12) {
      halfDiets = 1;
    } else {
      fullDiets = 1;
    }
  } else {
    const fullDays = Math.floor(hours / 24);
    const rem = hours - fullDays * 24;
    fullDiets = fullDays;
    if (rem > 0) {
      if (rem <= 8) {
        halfDiets = 1;
      } else {
        fullDiets += 1;
      }
    }
  }

  const rate = money(input.fullDietPln);
  const gross = rate.times(fullDiets).plus(rate.times(0.5).times(halfDiets));

  const breakfast = input.breakfastCount ?? 0;
  const lunch = input.lunchCount ?? 0;
  const dinner = input.dinnerCount ?? 0;
  const mealDeduction = rate
    .times(0.25)
    .times(breakfast)
    .plus(rate.times(0.5).times(lunch))
    .plus(rate.times(0.25).times(dinner));

  const net = moneyMax(gross.minus(mealDeduction), 0);

  const explanation = [
    `Czas: ${hours.toFixed(2)} h.`,
    hours <= 24
      ? `Delegacja do 24 h: pełne=${fullDiets}, 50%=${halfDiets}.`
      : `Delegacja >24 h: pełne doby=${Math.floor(hours / 24)}, pozostałość=${(hours % 24).toFixed(2)} h → pełne=${fullDiets}, 50%=${halfDiets}.`,
    `Stawka pełnej diety: ${moneyFixed(rate)} PLN.`,
    `Brutto diet: ${moneyFixed(gross)} PLN.`,
    `Odliczenia posiłków (śniad.×25%=${breakfast}, obiad×50%=${lunch}, kolacja×25%=${dinner}): ${moneyFixed(mealDeduction)} PLN.`,
    `Należność netto: ${moneyFixed(net)} PLN (nieujemna).`,
  ].join(" ");

  return {
    fullDiets,
    halfDiets,
    grossAmount: moneyFixed(gross),
    mealDeduction: moneyFixed(mealDeduction),
    netAmount: moneyFixed(net),
    explanation,
    ruleVersion: "PL-domestic-v1",
  };
}

export function hoursBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    throw new Error("Nieprawidłowy zakres dat/godzin delegacji.");
  }
  return (end - start) / (1000 * 60 * 60);
}

export function mealDeductionPreview(fullDietPln: string | number) {
  const rate = money(fullDietPln);
  return {
    breakfast: moneyFixed(moneyMul(rate, 0.25)),
    lunch: moneyFixed(moneyMul(rate, 0.5)),
    dinner: moneyFixed(moneyMul(rate, 0.25)),
  };
}
