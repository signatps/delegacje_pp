import { Link } from "react-router-dom";
import { Badge, EmptyState, PageHeader, Table } from "../components/ui";
import { useAppData } from "../state/AppData";

export function ExpensesPage() {
  const { expenses, trips } = useAppData();

  return (
    <div>
      <PageHeader title="Koszty" subtitle="Rachunki i wydatki powiązane z delegacjami" />
      {expenses.length === 0 ? (
        <EmptyState title="Brak kosztów" description="Dodaj koszty w szczegółach delegacji." />
      ) : (
        <Table headers={["Data", "Delegacja", "Kategoria", "Opis", "Kwota", "Płatnik", "Zwrot"]}>
          {expenses.map((e) => {
            const trip = trips.find((t) => t.id === e.tripId);
            return (
              <tr key={e.id} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2">{e.date}</td>
                <td className="px-3 py-2">
                  {trip ? (
                    <Link className="text-accent-600 hover:underline" to={`/delegacje/${trip.id}`}>
                      {trip.number}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2">{e.category}</td>
                <td className="px-3 py-2">
                  {e.description}
                  {e.withoutReceipt ? <Badge tone="warn">bez rachunku</Badge> : null}
                </td>
                <td className="px-3 py-2">
                  {e.amount} {e.currency}
                </td>
                <td className="px-3 py-2">{e.paidBy}</td>
                <td className="px-3 py-2">{e.refundAmount}</td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
