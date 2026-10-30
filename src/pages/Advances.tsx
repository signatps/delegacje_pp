import { Link } from "react-router-dom";
import { Badge, EmptyState, PageHeader, Table } from "../components/ui";
import { useAppData } from "../state/AppData";

export function AdvancesPage() {
  const { advances, trips } = useAppData();
  return (
    <div>
      <PageHeader title="Zaliczki" subtitle="Wnioski, zatwierdzenia i wypłaty — niewypłacona ≠ przekazana" />
      {advances.length === 0 ? (
        <EmptyState title="Brak zaliczek" description="Utwórz wniosek w szczegółach delegacji." />
      ) : (
        <Table headers={["Delegacja", "Wnioskowana", "Status", "Wypłacona", "Data"]}>
          {advances.map((a) => {
            const trip = trips.find((t) => t.id === a.tripId);
            return (
              <tr key={a.id} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2">
                  {trip ? <Link className="text-accent-600" to={`/delegacje/${trip.id}`}>{trip.number}</Link> : a.tripId}
                </td>
                <td className="px-3 py-2">{a.requestedAmount} {a.currency}</td>
                <td className="px-3 py-2"><Badge>{a.status}</Badge></td>
                <td className="px-3 py-2">{a.paidAmount ?? "—"}</td>
                <td className="px-3 py-2">{a.paidAt ?? "—"}</td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
