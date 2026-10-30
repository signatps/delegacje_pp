import { Link, useSearchParams } from "react-router-dom";
import { Badge, Button, EmptyState, PageHeader, Table } from "../components/ui";
import { useAppData } from "../state/AppData";
import { TRIP_STATUS_LABELS } from "../domain/types";

export function TripsPage() {
  const { trips, employees } = useAppData();
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").toLowerCase();

  const filtered = trips.filter((t) => {
    if (!q) return true;
    const emp = employees.find((e) => e.id === t.employeeId);
    return `${t.number} ${t.purpose} ${emp?.firstName ?? ""} ${emp?.lastName ?? ""}`.toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader
        title="Delegacje"
        subtitle="Zlecenia wyjazdów krajowych i zagranicznych"
        actions={
          <Link to="/delegacje/nowa">
            <Button>Nowa delegacja</Button>
          </Link>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState title="Brak delegacji" description="Utwórz zlecenie albo wczytaj scenariusz demo z pulpitu." />
      ) : (
        <Table headers={["Numer", "Pracownik", "Cel", "Okres", "Status", ""]}>
          {filtered.map((t) => {
            const emp = employees.find((e) => e.id === t.employeeId);
            return (
              <tr key={t.id} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2 font-medium">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{t.number}</span>
                    {t.isForeign ? <Badge tone="accent">Zagraniczna</Badge> : null}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {emp ? `${emp.firstName} ${emp.lastName}` : "—"}
                </td>
                <td className="px-3 py-2">{t.purpose}</td>
                <td className="px-3 py-2 text-xs">
                  {t.plannedStartAt.slice(0, 10)} → {t.plannedEndAt.slice(0, 10)}
                </td>
                <td className="px-3 py-2">
                  <Badge>{TRIP_STATUS_LABELS[t.status]}</Badge>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link to={`/delegacje/${t.id}`} className="text-sm text-accent-600 hover:underline">
                    Otwórz
                  </Link>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
