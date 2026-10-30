import { useMemo, useState } from "react";
import { Alert, Button, EmptyState, Field, Input, PageHeader, Select, Table } from "../components/ui";
import { useAppData } from "../state/AppData";
import { findEmployeeDuplicates, upsertEmployee } from "../data/repository";
import type { Employee } from "../domain/types";

const empty = (): Omit<Employee, "createdAt" | "updatedAt"> => ({
  id: "",
  firstName: "",
  lastName: "",
  employeeNumber: "",
  position: "",
  department: "",
  email: "",
  phone: "",
  workplace: "",
  residenceCity: "",
  bankAccount: "",
  managerId: null,
  status: "active",
  notes: "",
});

export function EmployeesPage() {
  const { employees, refresh } = useAppData();
  const [q, setQ] = useState("");
  const [form, setForm] = useState(empty());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dupWarn, setDupWarn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return employees;
    return employees.filter((e) =>
      `${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.department ?? ""} ${e.email ?? ""}`
        .toLowerCase()
        .includes(s),
    );
  }, [employees, q]);

  async function save() {
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.employeeNumber.trim()) {
      setError("Imię, nazwisko i numer ewidencyjny są wymagane.");
      return;
    }
    const dups = await findEmployeeDuplicates(form.firstName, form.lastName);
    const other = dups.filter((d) => d.id !== editingId);
    if (other.length && !dupWarn) {
      setDupWarn(`Wykryto potencjalny duplikat: ${other.map((d) => d.employeeNumber).join(", ")}. Zapisz ponownie, aby potwierdzić.`);
      return;
    }
    const { id: _ignoreId, ...rest } = form;
    await upsertEmployee({
      ...rest,
      ...(editingId ? { id: editingId } : {}),
      position: form.position || null,
      department: form.department || null,
      email: form.email || null,
      phone: form.phone || null,
      workplace: form.workplace || null,
      residenceCity: form.residenceCity || null,
      bankAccount: form.bankAccount || null,
      notes: form.notes || null,
    });
    setForm(empty());
    setEditingId(null);
    setDupWarn(null);
    await refresh();
  }

  function exportCsv() {
    const header = ["numer", "imie", "nazwisko", "stanowisko", "dzial", "email", "status"];
    const lines = [
      header.join(","),
      ...filtered.map((e) =>
        [e.employeeNumber, e.firstName, e.lastName, e.position ?? "", e.department ?? "", e.email ?? "", e.status]
          .map((x) => `"${String(x).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pracownicy.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv(file: File) {
    const text = await file.text();
    const rows = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const start = rows[0]?.toLowerCase().includes("numer") ? 1 : 0;
    for (const line of rows.slice(start)) {
      const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
      if (cols.length < 3) continue;
      await upsertEmployee({
        firstName: cols[1] || cols[0],
        lastName: cols[2] || cols[1],
        employeeNumber: cols[0],
        position: cols[3] || null,
        department: cols[4] || null,
        email: cols[5] || null,
        phone: null,
        workplace: null,
        residenceCity: null,
        bankAccount: null,
        managerId: null,
        status: "active",
        notes: "Import CSV",
      });
    }
    await refresh();
  }

  return (
    <div>
      <PageHeader
        title="Pracownicy"
        subtitle="Kartoteka bez PESEL — dezaktywacja zachowuje historię"
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}>
              Eksport CSV
            </Button>
            <label className="inline-flex cursor-pointer items-center rounded-md border border-[var(--color-border)] px-3 py-2 text-sm">
              Import CSV
              <input
                type="file"
                accept=".csv,.xlsx,.xls,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importCsv(f);
                }}
              />
            </label>
          </>
        }
      />

      <div className="mb-4">
        <Input placeholder="Szukaj…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {filtered.length === 0 ? (
          <EmptyState title="Brak pracowników" description="Dodaj pierwszego pracownika po prawej stronie." />
        ) : (
          <Table headers={["Numer", "Imię i nazwisko", "Dział", "Status", ""]}>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2">{e.employeeNumber}</td>
                <td className="px-3 py-2">
                  {e.firstName} {e.lastName}
                  <div className="text-xs text-[var(--muted)]">{e.position}</div>
                </td>
                <td className="px-3 py-2">{e.department ?? "—"}</td>
                <td className="px-3 py-2">{e.status === "active" ? "Aktywny" : "Nieaktywny"}</td>
                <td className="px-3 py-2 text-right">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingId(e.id);
                      setForm({ ...e });
                      setDupWarn(null);
                    }}
                  >
                    Edytuj
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}

        <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4">
          <h2 className="font-semibold">{editingId ? "Edycja pracownika" : "Nowy pracownik"}</h2>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          {dupWarn ? <Alert tone="warn">{dupWarn}</Alert> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Imię">
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Field>
            <Field label="Nazwisko">
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Field>
            <Field label="Numer ewidencyjny">
              <Input value={form.employeeNumber} onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Employee["status"] })}>
                <option value="active">Aktywny</option>
                <option value="inactive">Nieaktywny</option>
              </Select>
            </Field>
            <Field label="Stanowisko">
              <Input value={form.position ?? ""} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </Field>
            <Field label="Dział">
              <Input value={form.department ?? ""} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </Field>
            <Field label="E-mail">
              <Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Telefon">
              <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Miejsce pracy">
              <Input value={form.workplace ?? ""} onChange={(e) => setForm({ ...form, workplace: e.target.value })} />
            </Field>
            <Field label="Miejscowość pobytu">
              <Input value={form.residenceCity ?? ""} onChange={(e) => setForm({ ...form, residenceCity: e.target.value })} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void save()}>Zapisz</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setForm(empty());
                setEditingId(null);
                setDupWarn(null);
              }}
            >
              Wyczyść
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
