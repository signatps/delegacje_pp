import { describe, expect, it } from "vitest";
import { calculateDomesticDiet } from "./dietDomestic";

const RATE = "45.00";

describe("calculateDomesticDiet", () => {
  it("brak diety poniżej 8h", () => {
    expect(calculateDomesticDiet({ durationHours: 7 + 59 / 60, fullDietPln: RATE }).netAmount).toBe("0.00");
  });

  it("dokładnie 8:00 → 50%", () => {
    expect(calculateDomesticDiet({ durationHours: 8, fullDietPln: RATE }).netAmount).toBe("22.50");
  });

  it("dokładnie 12:00 → 50%", () => {
    expect(calculateDomesticDiet({ durationHours: 12, fullDietPln: RATE }).netAmount).toBe("22.50");
  });

  it("12:01 → 100%", () => {
    expect(calculateDomesticDiet({ durationHours: 12 + 1 / 60, fullDietPln: RATE }).netAmount).toBe("45.00");
  });

  it("dokładnie 24:00 → 100%", () => {
    expect(calculateDomesticDiet({ durationHours: 24, fullDietPln: RATE }).netAmount).toBe("45.00");
  });

  it("24:01 → 100% + 50%", () => {
    expect(calculateDomesticDiet({ durationHours: 24 + 1 / 60, fullDietPln: RATE }).netAmount).toBe("67.50");
  });

  it("32:00 → 100% + 50%", () => {
    expect(calculateDomesticDiet({ durationHours: 32, fullDietPln: RATE }).netAmount).toBe("67.50");
  });

  it("32:01 → 200%", () => {
    expect(calculateDomesticDiet({ durationHours: 32 + 1 / 60, fullDietPln: RATE }).netAmount).toBe("90.00");
  });

  it("śniadanie hotelowe 25%", () => {
    const r = calculateDomesticDiet({
      durationHours: 24,
      fullDietPln: RATE,
      breakfastCount: 1,
    });
    expect(r.mealDeduction).toBe("11.25");
    expect(r.netAmount).toBe("33.75");
  });

  it("pełne posiłki nie dają kwoty ujemnej", () => {
    const r = calculateDomesticDiet({
      durationHours: 8,
      fullDietPln: RATE,
      breakfastCount: 1,
      lunchCount: 1,
      dinnerCount: 1,
    });
    expect(r.netAmount).toBe("0.00");
  });

  it("wyłączenie diety z podstawą", () => {
    const r = calculateDomesticDiet({ durationHours: 24, fullDietPln: RATE, disabled: true });
    expect(r.netAmount).toBe("0.00");
  });
});
