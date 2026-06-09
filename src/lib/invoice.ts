// Core invoice logic — mirrors the ANY'S template exactly.
// The entered amount is the GST-EXCLUSIVE subtotal (the line-item sum).
// GST (10%) is added on top to produce the grand total.

export interface LineItem {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceModel {
  invoiceNumber: string; // e.g. "#20260610"
  dateSerial: number; // Excel serial date for cell A11
  lines: LineItem[]; // 1 or 2 lines (full units + remainder)
  subtotal: number;
  gst: number;
  total: number;
}

export interface InvoiceInput {
  date: string; // "YYYY-MM-DD" from the date input
  unitPrice: number;
  subtotal: number; // GST-exclusive amount the user types as "total price"
  description: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Excel serial date (1900 system, accounting for the 1900 leap-year bug). */
export function toExcelSerial(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Days since 1899-12-30 (Excel's epoch, which absorbs the leap bug).
  const utc = Date.UTC(y, m - 1, d);
  const epoch = Date.UTC(1899, 11, 30);
  return Math.round((utc - epoch) / 86400000);
}

/** "YYYY-MM-DD" -> "#YYYYMMDD" invoice number. */
export function toInvoiceNumber(dateStr: string): string {
  return "#" + dateStr.replace(/-/g, "");
}

/**
 * Split the subtotal into the template's two-line shape:
 *  - line 1: as many full units at unitPrice as fit
 *  - line 2: a single unit for the remainder (only if remainder > 0)
 */
export function buildInvoice(input: InvoiceInput): InvoiceModel {
  const { date, unitPrice, subtotal, description } = input;
  const desc = description.trim() || "Maintenance Labour";

  const safeUnit = unitPrice > 0 ? unitPrice : 0;
  const fullUnits = safeUnit > 0 ? Math.floor(subtotal / safeUnit) : 0;
  const fullAmount = round2(fullUnits * safeUnit);
  const remainder = round2(subtotal - fullAmount);

  const lines: LineItem[] = [];
  if (fullUnits > 0) {
    lines.push({ description: desc, qty: fullUnits, unitPrice: safeUnit, amount: fullAmount });
  }
  if (remainder > 0 || lines.length === 0) {
    lines.push({ description: desc, qty: 1, unitPrice: remainder, amount: remainder });
  }

  const cleanSubtotal = round2(subtotal);
  const gst = round2(cleanSubtotal / 10);
  const total = round2(cleanSubtotal + gst);

  return {
    invoiceNumber: toInvoiceNumber(date),
    dateSerial: toExcelSerial(date),
    lines,
    subtotal: cleanSubtotal,
    gst,
    total,
  };
}

export const formatMoney = (n: number) =>
  n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
