import { money, moneyFixed, moneyMax, type MoneyString } from "./money";

export interface ForeignDietInput {
  durationHours: number;
  fullDietAmount: string | number;
  currency: string;
  breakfastCount?: number;
  lunchCount?: number;
  dinnerCount?: number;
  fullBoard?: boolean;
  disabled?: boolean;
}

export interface ForeignDietBreakdown {
  fullDiets: number;
  thirdDiets: number;
  halfDiets: number;
  grossAmount: MoneyString;
  mealDeduction: MoneyString;
  netAmount: MoneyString;
  currency: string;
  explanation: string;
  ruleVersion: "PL-foreign-v1";
}

/**
 * Foreign diet: each full day 100%; incomplete ≤8h → 1/3; >8–12h → 50%; >12h → 100%.
 * Meals: breakfast 15%, lunch 30%, dinner 30%. Full board deducts remaining entitlement.
 */
export function calculateForeignDiet(input: ForeignDietInput): ForeignDietBreakdown {
  if (input.disabled) {
    return {
      fullDiets: 0,
      thirdDiets: 0,
      halfDiets: 0,
      grossAmount: "0.00",
      mealDeduction: "0.00",
      netAmount: "0.00",
      currency: input.currency,
      explanation: "Dieta zagraniczna wyłączona (wymagana przyczyna).",
      ruleVersion: "PL-foreign-v1",
    };
  }

  const hours = input.durationHours;
  if (!Number.isFinite(hours) || hours < 0) {
    throw new Error("Czas trwania części zagranicznej musi być liczbą nieujemną.");
  }

  const fullDays = Math.floor(hours / 24);
  const rem = hours - fullDays * 24;
  let fullDiets = fullDays;
  let thirdDiets = 0;
  let halfDiets = 0;

  if (hours === 0) {
    // nothing
  } else if (hours <= 24) {
    if (hours <= 8) {
      thirdDiets = 1;
    } else if (hours <= 12) {
      halfDiets = 1;
    } else {
      fullDiets = 1;
    }
  } else if (rem > 0) {
    if (rem <= 8) {
      thirdDiets = 1;
    } else if (rem <= 12) {
      halfDiets = 1;
    } else {
      fullDiets += 1;
    }
  }

  const rate = money(input.fullDietAmount);
  const gross = rate
    .times(fullDiets)
    .plus(rate.div(3).times(thirdDiets))
    .plus(rate.times(0.5).times(halfDiets));

  let mealDeduction = money(0);
  if (input.fullBoard) {
    mealDeduction = gross;
  } else {
    const breakfast = input.breakfastCount ?? 0;
    const lunch = input.lunchCount ?? 0;
    const dinner = input.dinnerCount ?? 0;
    mealDeduction = rate
      .times(0.15)
      .times(breakfast)
      .plus(rate.times(0.3).times(lunch))
      .plus(rate.times(0.3).times(dinner));
  }

  const net = moneyMax(gross.minus(mealDeduction), 0);

  return {
    fullDiets,
    thirdDiets,
    halfDiets,
    grossAmount: moneyFixed(gross),
    mealDeduction: moneyFixed(mealDeduction),
    netAmount: moneyFixed(net),
    currency: input.currency,
    explanation: [
      `Czas zagraniczny: ${hours.toFixed(2)} h.`,
      `Pełne=${fullDiets}, 1/3=${thirdDiets}, 50%=${halfDiets}.`,
      `Stawka: ${moneyFixed(rate)} ${input.currency}/doba.`,
      `Brutto: ${moneyFixed(gross)} ${input.currency}.`,
      `Odliczenia posiłków: ${moneyFixed(mealDeduction)} ${input.currency}.`,
      `Netto: ${moneyFixed(net)} ${input.currency}.`,
    ].join(" "),
    ruleVersion: "PL-foreign-v1",
  };
}
