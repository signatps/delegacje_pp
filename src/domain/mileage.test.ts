import { describe, expect, it } from "vitest";
import { calculateMileage, classifyEngineCategory } from "./mileage";

describe("mileage", () => {
  it("klasyfikuje 900 i 901 cm³", () => {
    expect(classifyEngineCategory("benzyna", 900)).toBe("do_900");
    expect(classifyEngineCategory("benzyna", 901)).toBe("powyzej_900");
  });

  it("elektryk bez pojemności", () => {
    expect(classifyEngineCategory("elektryczny", null)).toBe("bez_pojemnosci");
  });

  it("hybryda według pojemności spalinowej", () => {
    expect(classifyEngineCategory("hybryda", 999)).toBe("powyzej_900");
  });

  it("liczy zwrot dla prywatnego >900", () => {
    const r = calculateMileage({
      acceptedKm: "100",
      ratePlnPerKm: "1.15",
      vehicleKind: "private",
      engineCategory: "powyzej_900",
    });
    expect(r.amountPln).toBe("115.00");
  });

  it("samochód służbowy bez automatycznej kilometrówki", () => {
    const r = calculateMileage({
      acceptedKm: "100",
      ratePlnPerKm: "1.15",
      vehicleKind: "company",
      engineCategory: "powyzej_900",
    });
    expect(r.reimbursable).toBe(false);
    expect(r.amountPln).toBe("0.00");
  });

  it("elektryk wymaga stawki pracodawcy", () => {
    const r = calculateMileage({
      acceptedKm: "50",
      ratePlnPerKm: "1.15",
      vehicleKind: "private",
      engineCategory: "bez_pojemnosci",
    });
    expect(r.reimbursable).toBe(false);
  });
});
