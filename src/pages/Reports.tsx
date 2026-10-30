import { useMemo, useState } from "react";
import { Button, Field, Input, PageHeader, Select, Table } from "../components/ui";
import { useAppData } from "../state/AppData";
import { money, moneyFixed } from "../domain/money";

export function ReportsPage() {
  const { trips, employees, expenses, advances } = useAppData();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      if (employeeId && t.employeeId !== employeeId) return false;
      const d = t.plannedStartAt.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [trips, from, to, employeeId]);

  const byEmployee = useMemo(() => {
    const map = new Map<string, { count: number; expenses: ReturnType<typeof money> }>();
    for (const t of filteredTrips) {
      const cur = map.get(t.employeeId) ?? { count: 0, expenses: money(0) };
      cur.count += 1;
      const tripExp = expenses.filter((e) => e.tripId === t.id);
      for (const e of tripExp) cur.expenses = cur.expenses.plus(e.currency === "PLN" ? e.amount : 0);
      map.set(t.employeeId, cur);
    }
    return [...map.entries()];
  }, [filteredTrips, expenses]);

  const overdue = filteredTrips.filter((t) => {
    if (!["awaiting_settlement", "settlement_draft", "settlement_review"].includes(t.status)) return false;
    const end = new Date(t.actualEndAt ?? t.plannedEndAt);
    const due = new Date(end);
    due.setDate(due.getDate() + 14);
    return due < new Date();
  });

  const openAdvances = advances.filter((a) => a.status === "paid" || a.status === "partially_settled");

  function exportCsv() {
    const lines = ["pracownik,liczba_delegacji,koszty_pln"];
    for (const [id, row] of byEmployee) {
      const emp = employees.find((e) => e.id === id);
      lines.push(`"${emp ? `${emp.firstName} ${emp.lastName}` : id}",${row.count},${moneyFixed(row.expenses)}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "raport-delegacji.csv";
    a.click();
  }

  return (
    <div>
      <PageHeader
        title="Raporty"
        subtitle="Filtry: okres, pracownik — koszty firmy vs należność pracownika rozdzielane w rozliczeniu"
        actions={<Button onClick={exportCsv}>Eksport CSV</Button>}
      />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Field label="Od">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Do">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field label="Pracownik">
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Wszyscy</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4">
          <div className="text-xs text-[var(--muted)]">Liczba delegacji</div>
          <div className="font-display text-3xl">{filteredTrips.length}</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4">
          <div className="text-xs text-[var(--muted)]">Po terminie rozliczenia</div>
          <div className="font-display text-3xl">{overdue.length}</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4">
          <div className="text-xs text-[var(--muted)]">Zaliczki nierozliczone</div>
          <div className="font-display text-3xl">{openAdvances.length}</div>
        </div>
      </div>

      <Table headers={["Pracownik", "Liczba delegacji", "Koszty PLN (uproszczenie)"]}>
        {byEmployee.map(([id, row]) => {
          const emp = employees.find((e) => e.id === id);
          return (
            <tr key={id} className="border-t border-[var(--color-border)]">
              <td className="px-3 py-2">{emp ? `${emp.firstName} ${emp.lastName}` : id}</td>
              <td className="px-3 py-2">{row.count}</td>
              <td className="px-3 py-2">{moneyFixed(row.expenses)}</td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
