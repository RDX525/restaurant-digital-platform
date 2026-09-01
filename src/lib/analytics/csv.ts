import type { AnalyticsReport } from "./types";

function escapeCsv(value: string | number): string {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function analyticsReportToCsv(report: AnalyticsReport): string {
  const rows: string[][] = [
    ["Metric", "Value"],
    ["Range", report.range.label],
    ["Timezone", report.range.timezone],
    ["Start date", report.range.startDate],
    ["End date", report.range.endDate],
    ["Revenue (paid orders)", report.revenue.toFixed(2)],
    ["Orders (paid)", String(report.orders)],
    ["Average order value", report.averageOrderValue.toFixed(2)],
    ["Pickup orders", String(report.ordersByType.pickup)],
    ["Delivery orders", String(report.ordersByType.delivery)],
    ["Dine-in orders", String(report.ordersByType.dine_in)],
    ["New customers", String(report.newCustomers)],
    ["Returning customers", String(report.returningCustomers)],
    ["Reservations (service dates)", String(report.reservations)],
    ["Reservation cancellations (in period)", String(report.reservationCancellations)],
    ["Reservation no-shows (service dates)", String(report.reservationNoShows)],
    ["Website visitors", String(report.websiteVisitors)],
    ["Menu views", String(report.menuViews)],
    ["QR scans", String(report.qrScans)],
    ["Checkout started", String(report.checkoutStarted)],
    ["Order conversion %", report.orderConversionRate.toFixed(2)],
    ["Reservation started", String(report.reservationStarted)],
    ["Reservation conversion %", report.reservationConversionRate.toFixed(2)],
    [],
    ["Best selling items", "Quantity", "Revenue"],
    ...report.bestSellingItems.map((item) => [
      item.name,
      String(item.quantity),
      item.revenue.toFixed(2),
    ]),
    [],
    ["Slow moving items", "Quantity", "Revenue"],
    ...report.slowMovingItems.map((item) => [
      item.name,
      String(item.quantity),
      item.revenue.toFixed(2),
    ]),
  ];

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}
