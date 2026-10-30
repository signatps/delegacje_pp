import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { BusinessTrip, Company, Employee, Settlement } from "../domain/types";
import { formatMoney, formatPln } from "../domain/money";

function addHeader(doc: jsPDF, company: Company, title: string, number: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(company.name, 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const line2 = [
    company.address,
    `${company.postalCode ?? ""} ${company.city ?? ""}`.trim(),
    company.nip ? `NIP ${company.nip}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  doc.text(line2, 14, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 40);
  doc.setFontSize(11);
  doc.text(`Nr: ${number}`, 14, 48);
}

export function generateTripOrderPdf(company: Company, trip: BusinessTrip, employee: Employee) {
  const doc = new jsPDF();
  addHeader(doc, company, trip.isForeign ? "Zlecenie wyjazdu zagranicznego" : "Polecenie wyjazdu służbowego", trip.number);
  autoTable(doc, {
    startY: 56,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10 },
    body: [
      ["Pracownik", `${employee.firstName} ${employee.lastName}`],
      ["Stanowisko", employee.position ?? "—"],
      ["Cel", trip.purpose],
      ["Opis", trip.description ?? "—"],
      ["Miejsce rozpoczęcia", trip.startPlace],
      ["Destynacje", trip.destinations.map((d) => `${d.place} (${d.countryCode}${d.isTransit ? ", tranzyt" : ""})`).join(" → ") || "—"],
      ["Planowany okres", `${trip.plannedStartAt.replace("T", " ").slice(0, 16)} — ${trip.plannedEndAt.replace("T", " ").slice(0, 16)}`],
      ["Status", trip.status],
      ["Uwagi", trip.notes ?? "—"],
    ],
  });
  const y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 120) + 20;
  doc.text("Podpis zlecającego: __________________", 14, y);
  doc.text("Podpis zatwierdzającego: __________________", 14, y + 12);
  doc.text("Uwaga: akceptacja w systemie nie jest kwalifikowanym podpisem elektronicznym.", 14, y + 28);
  return doc;
}

export function generateSettlementPdf(
  company: Company,
  trip: BusinessTrip,
  employee: Employee,
  settlement: Settlement,
) {
  const doc = new jsPDF();
  addHeader(doc, company, "Rozliczenie delegacji służbowej", trip.number);
  doc.setFontSize(10);
  doc.text(`Pracownik: ${employee.firstName} ${employee.lastName}`, 14, 56);
  doc.text(
    `Okres rzeczywisty: ${(trip.actualStartAt ?? trip.plannedStartAt).replace("T", " ").slice(0, 16)} — ${(trip.actualEndAt ?? trip.plannedEndAt).replace("T", " ").slice(0, 16)}`,
    14,
    62,
  );
  autoTable(doc, {
    startY: 70,
    head: [["Pozycja", "Kwota", "Waluta", "PLN", "Jak obliczono?"]],
    body: settlement.lines.map((l) => [
      l.label,
      l.amount,
      l.currency,
      l.amountPln,
      l.explanation.slice(0, 80) + (l.explanation.length > 80 ? "…" : ""),
    ]),
    styles: { fontSize: 8 },
  });
  const y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 140) + 10;
  doc.setFont("helvetica", "bold");
  doc.text(`Należność przed zaliczką: ${formatPln(settlement.totalDueBeforeAdvance)}`, 14, y);
  doc.text(`Zaliczki wypłacone: ${formatPln(settlement.advancesPaid)}`, 14, y + 7);
  doc.text(`Do wypłaty / zwrotu: ${formatPln(settlement.amountToPayOrReturn)}`, 14, y + 14);
  doc.text(`Koszty firmy: ${formatPln(settlement.companyPaidCosts)}`, 14, y + 21);
  if (settlement.dueAt) {
    doc.setFont("helvetica", "normal");
    doc.text(`Termin rozliczenia: ${settlement.dueAt.slice(0, 10)}`, 14, y + 30);
  }
  return doc;
}

export function generateMileageLogPdf(
  company: Company,
  trip: BusinessTrip,
  employee: Employee,
  rows: Array<{ date: string; route: string; km: string; rate: string; amount: string; plate: string }>,
) {
  const doc = new jsPDF();
  addHeader(doc, company, "Ewidencja przebiegu pojazdu", trip.number);
  doc.text(`Pracownik: ${employee.firstName} ${employee.lastName}`, 14, 56);
  autoTable(doc, {
    startY: 62,
    head: [["Data", "Nr rej.", "Trasa", "Km", "Stawka", "Zwrot"]],
    body: rows.map((r) => [r.date, r.plate, r.route, r.km, formatMoney(r.rate, "PLN"), formatPln(r.amount)]),
  });
  return doc;
}

export function downloadPdf(doc: jsPDF, fileName: string) {
  doc.save(fileName);
}
