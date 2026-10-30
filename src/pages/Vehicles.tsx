import { useState } from "react";
import { Alert, Badge, Button, Field, Input, PageHeader, Select, Table } from "../components/ui";
import { useAppData } from "../state/AppData";
import { upsertVehicle } from "../data/repository";
import { classifyEngineCategory } from "../domain/mileage";
import type { FuelType, Vehicle } from "../domain/types";

const blank = (): Omit<Vehicle, "createdAt" | "updatedAt"> => ({
  id: "",
  kind: "private",
  ownerEmployeeId: null,
  brand: "",
  model: "",
  plateNumber: "",
  fuelType: "benzyna",
  engineCapacityCcm: 1600,
  engineCategory: "powyzej_900",
  customMileageRate: null,
  customRateBasis: null,
  needsAccountingReview: false,
  usageForm: null,
  defaultUserId: null,
  employerConsent: true,
  status: "active",
  notes: null,
});

export function VehiclesPage() {
  const { vehicles, employees, refresh } = useAppData();
  const [form, setForm] = useState(blank());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function syncCategory(next: typeof form) {
    const cat = classifyEngineCategory(next.fuelType, next.engineCapacityCcm);
    return {
      ...next,
      engineCategory: cat,
      needsAccountingReview: cat === "bez_pojemnosci" || cat === "do_weryfikacji" || next.fuelType === "hybryda",
    };
  }

  async function save() {
    if (!form.brand || !form.model || !form.plateNumber) {
      setMsg("Marka, model i numer rejestracyjny są wymagane.");
      return;
    }
    if ((form.engineCategory === "bez_pojemnosci" || form.engineCategory === "do_weryfikacji") && !form.customMileageRate) {
      setMsg("Dla pojazdu bez pojemności ustaw stawkę pracodawcy i podstawę decyzji.");
      return;
    }
    if (form.customMileageRate && !form.customRateBasis) {
      setMsg("Podaj podstawę decyzji dla stawki indywidualnej.");
      return;
    }
    const { id: _ignoreId, ...rest } = form;
    await upsertVehicle({ ...rest, ...(editingId ? { id: editingId } : {}) });
    setForm(blank());
    setEditingId(null);
    setMsg(null);
    await refresh();
  }

  return (
    <div>
      <PageHeader title="Pojazdy" subtitle="Prywatne (kilometrówka) i służbowe (koszty bez auto-km)" />
      {msg ? <div className="mb-4"><Alert tone="warn">{msg}</Alert></div> : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Table headers={["Nr rej.", "Pojazd", "Rodzaj", "Kategoria", "Status", ""]}>
          {vehicles.map((v) => (
            <tr key={v.id} className="border-t border-[var(--color-border)]">
              <td className="px-3 py-2 font-medium">{v.plateNumber}</td>
              <td className="px-3 py-2">
                {v.brand} {v.model}
                {v.needsAccountingReview ? (
                  <div className="mt-1">
                    <Badge tone="warn">Do weryfikacji księgowości</Badge>
                  </div>
                ) : null}
              </td>
              <td className="px-3 py-2">{v.kind === "private" ? "Prywatny" : "Służbowy"}</td>
              <td className="px-3 py-2">{v.engineCategory}</td>
              <td className="px-3 py-2">{v.status}</td>
              <td className="px-3 py-2 text-right">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingId(v.id);
                    setForm({ ...v });
                  }}
                >
                  Edytuj
                </Button>
              </td>
            </tr>
          ))}
        </Table>

        <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4">
          <h2 className="font-semibold">{editingId ? "Edycja pojazdu" : "Nowy pojazd"}</h2>
          <Field label="Rodzaj">
            <Select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as Vehicle["kind"] })}
            >
              <option value="private">Prywatny</option>
              <option value="company">Służbowy</option>
            </Select>
          </Field>
          {form.kind === "private" ? (
            <Field label="Właściciel / użytkownik">
              <Select
                value={form.ownerEmployeeId ?? ""}
                onChange={(e) => setForm({ ...form, ownerEmployeeId: e.target.value || null })}
              >
                <option value="">—</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Forma użytkowania">
              <Select
                value={form.usageForm ?? "ownership"}
                onChange={(e) => setForm({ ...form, usageForm: e.target.value as Vehicle["usageForm"] })}
              >
                <option value="ownership">Własność</option>
                <option value="leasing">Leasing</option>
                <option value="rental">Wynajem</option>
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marka">
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </Field>
            <Field label="Model">
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </Field>
          </div>
          <Field label="Numer rejestracyjny">
            <Input value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} />
          </Field>
          <Field label="Napęd">
            <Select
              value={form.fuelType}
              onChange={(e) =>
                setForm(syncCategory({ ...form, fuelType: e.target.value as FuelType }))
              }
            >
              {["benzyna", "diesel", "lpg", "hybryda", "elektryczny", "inny"].map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pojemność cm³ (jeśli dotyczy)">
            <Input
              type="number"
              value={form.engineCapacityCcm ?? ""}
              onChange={(e) =>
                setForm(
                  syncCategory({
                    ...form,
                    engineCapacityCcm: e.target.value === "" ? null : Number(e.target.value),
                  }),
                )
              }
            />
          </Field>
          <div className="text-xs text-[var(--muted)]">Kategoria: {form.engineCategory}</div>
          <Field label="Indywidualna stawka PLN/km">
            <Input
              value={form.customMileageRate ?? ""}
              onChange={(e) => setForm({ ...form, customMileageRate: e.target.value || null })}
            />
          </Field>
          <Field label="Podstawa decyzji / stawki">
            <Input
              value={form.customRateBasis ?? ""}
              onChange={(e) => setForm({ ...form, customRateBasis: e.target.value || null })}
            />
          </Field>
          <Button onClick={() => void save()}>Zapisz</Button>
        </div>
      </div>
    </div>
  );
}
