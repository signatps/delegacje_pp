import type { EngineCategory, FuelType } from "./types";
import { money, moneyFixed, type MoneyString } from "./money";

export interface MileageInput {
  acceptedKm: string | number;
  ratePlnPerKm: string | number;
  vehicleKind: "private" | "company";
  engineCategory: EngineCategory;
  customRate?: string | number | null;
  customRateBasis?: string | null;
}

export interface MileageResult {
  reimbursable: boolean;
  km: MoneyString;
  rateUsed: MoneyString;
  amountPln: MoneyString;
  warning: string | null;
  explanation: string;
}

export function classifyEngineCategory(
  fuelType: FuelType,
  engineCapacityCcm: number | null,
): EngineCategory {
  if (fuelType === "elektryczny" || fuelType === "inny") {
    return "bez_pojemnosci";
  }
  if (engineCapacityCcm == null || Number.isNaN(engineCapacityCcm)) {
    return "do_weryfikacji";
  }
  if (fuelType === "hybryda") {
    return engineCapacityCcm <= 900 ? "do_900" : "powyzej_900";
  }
  return engineCapacityCcm <= 900 ? "do_900" : "powyzej_900";
}

export function calculateMileage(input: MileageInput): MileageResult {
  if (input.vehicleKind === "company") {
    return {
      reimbursable: false,
      km: moneyFixed(input.acceptedKm, 1),
      rateUsed: "0.00",
      amountPln: "0.00",
      warning: "Samochód służbowy — brak automatycznej kilometrówki. Rozliczaj paliwo/parkingi jako koszty.",
      explanation: "Dla pojazdu służbowego nie nalicza się kilometrówki automatycznie.",
    };
  }

  let rate = money(input.ratePlnPerKm);
  let warning: string | null = null;

  if (input.engineCategory === "bez_pojemnosci" || input.engineCategory === "do_weryfikacji") {
    if (input.customRate == null || input.customRate === "") {
      return {
        reimbursable: false,
        km: moneyFixed(input.acceptedKm, 1),
        rateUsed: "0.00",
        amountPln: "0.00",
        warning:
          "Pojazd bez kategorii pojemności — wymagana stawka pracodawcy i weryfikacja księgowości.",
        explanation: "Brak stawki indywidualnej dla pojazdu bez pojemności silnika spalinowego.",
      };
    }
    rate = money(input.customRate);
    warning = `Użyto stawki pracodawcy ${moneyFixed(rate)} PLN/km. Podstawa: ${input.customRateBasis ?? "brak opisu"}. Wymaga weryfikacji księgowości.`;
  } else if (input.customRate != null && input.customRate !== "") {
    const custom = money(input.customRate);
    if (custom.gt(rate)) {
      warning = `Stawka pracodawcy ${moneyFixed(custom)} przekracza stawkę ustawową ${moneyFixed(rate)} PLN/km — oznaczono do weryfikacji podatkowej.`;
    }
    rate = custom;
  }

  const amount = money(input.acceptedKm).times(rate);
  return {
    reimbursable: true,
    km: moneyFixed(input.acceptedKm, 1),
    rateUsed: moneyFixed(rate),
    amountPln: moneyFixed(amount),
    warning,
    explanation: `Zwrot = ${moneyFixed(input.acceptedKm, 1)} km × ${moneyFixed(rate)} PLN/km = ${moneyFixed(amount)} PLN.`,
  };
}

export function distanceDiff(mapKm: number, actualKm: number) {
  const diff = actualKm - mapKm;
  const pct = mapKm === 0 ? 0 : (diff / mapKm) * 100;
  return { diffKm: Number(diff.toFixed(1)), diffPct: Number(pct.toFixed(1)) };
}
