import { describe, expect, it } from "vitest";
import { calculateForeignDiet } from "./dietForeign";

describe("calculateForeignDiet", () => {
  it("dokładnie 8:00 → 1/3", () => {
    const r = calculateForeignDiet({ durationHours: 8, fullDietAmount: "50", currency: "EUR" });
    expect(r.netAmount).toBe("16.67");
  });

  it("8:01 → 50%", () => {
    const r = calculateForeignDiet({ durationHours: 8 + 1 / 60, fullDietAmount: "50", currency: "EUR" });
    expect(r.netAmount).toBe("25.00");
  });

  it("12:00 → 50%", () => {
    expect(calculateForeignDiet({ durationHours: 12, fullDietAmount: "50", currency: "EUR" }).netAmount).toBe(
      "25.00",
    );
  });

  it("12:01 → 100%", () => {
    expect(
      calculateForeignDiet({ durationHours: 12 + 1 / 60, fullDietAmount: "50", currency: "EUR" }).netAmount,
    ).toBe("50.00");
  });

  it("wiele dób + niepełna", () => {
    // 48h + 9h = 2 full + 50%
    const r = calculateForeignDiet({ durationHours: 57, fullDietAmount: "50", currency: "EUR" });
    expect(r.fullDiets).toBe(2);
    expect(r.halfDiets).toBe(1);
    expect(r.netAmount).toBe("125.00");
  });

  it("pełne wyżywienie", () => {
    const r = calculateForeignDiet({
      durationHours: 24,
      fullDietAmount: "50",
      currency: "EUR",
      fullBoard: true,
    });
    expect(r.netAmount).toBe("0.00");
  });
});
