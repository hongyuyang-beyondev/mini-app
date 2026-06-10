import JSZip from "jszip";
import type { InvoiceModel } from "./invoice";

// Editable header/company constants (defaults match the template).
export interface HeaderInfo {
  businessName: string;
  abn: string;
  billTo: string;
  accountName: string;
  bsb: string;
  accountNumber: string;
}

export const DEFAULT_HEADER: HeaderInfo = {
  businessName: "ANY'S",
  abn: "93 323 804 908",
  billTo: "NEUE PROPERTY MAINTENANCE GROUP PTY LTD",
  accountName: "Xin Mou",
  bsb: "063109",
  accountNumber: "13517745",
};

// --- original strings/values present in the pristine template ---------------
const ORIG = {
  abn: "ABN:93 323 804 908",
  billTo: "Bill To:NEUE PROPERTY MAINTENANCE GROUP PTY LTD",
  accountName: "Xin Mou",
  bsb: "063109",
  description: "Maintenance Labour",
  invoiceNumber: "#20260610",
};

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Replace exactly one known substring (shared-string text) in the XML. */
function swap(xml: string, original: string, next: string): string {
  return xml.split(original).join(next);
}

/** Rewrite a single cell by ref, preserving its style attrs; keeps a formula if present. */
function setCellNum(xml: string, ref: string, value: number): string {
  const re = new RegExp(`<c r="${ref}"([^>]*?)(?:/>|>([\\s\\S]*?)</c>)`);
  const m = xml.match(re);
  if (!m) throw new Error(`cell ${ref} not found`);
  const attrs = m[1];
  const inner = m[2] || "";
  const f = (inner.match(/<f[^>]*>[\s\S]*?<\/f>/) || [""])[0];
  return xml.replace(re, `<c r="${ref}"${attrs}>${f}<v>${value}</v></c>`);
}

/** Empty a cell but keep its style (used when there is no second line). */
function clearCell(xml: string, ref: string): string {
  const re = new RegExp(`<c r="${ref}"([^>]*?)(?:/>|>([\\s\\S]*?)</c>)`);
  const m = xml.match(re);
  if (!m) return xml;
  return xml.replace(re, `<c r="${ref}"${m[1]}/>`);
}

/**
 * Load the pristine template, patch only the changing values, and return a Blob
 * that is byte-identical to the original except for the data.
 */
export async function generateXlsx(
  model: InvoiceModel,
  header: HeaderInfo
): Promise<Blob> {
  const res = await fetch(`${import.meta.env.BASE_URL}template.xlsx`);
  const buf = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  // --- sharedStrings.xml : text fields ---
  let shared = await zip.file("xl/sharedStrings.xml")!.async("string");
  // company name -> cell A1 (the pristine template stores a placeholder "c" there)
  shared = swap(
    shared,
    "<si><t>c</t></si>",
    "<si><t>" + escapeXml(header.businessName) + "</t></si>"
  );
  shared = swap(shared, ORIG.invoiceNumber, escapeXml(model.invoiceNumber));
  shared = swap(shared, ORIG.description, escapeXml(model.lines[0].description));
  shared = swap(shared, ORIG.abn, "ABN:" + escapeXml(header.abn));
  shared = swap(shared, ORIG.billTo, "Bill To:" + escapeXml(header.billTo));
  shared = swap(shared, ORIG.accountName, escapeXml(header.accountName));
  shared = swap(shared, ORIG.bsb, escapeXml(header.bsb));
  zip.file("xl/sharedStrings.xml", shared);

  // --- sheet1.xml : numbers, date, totals ---
  let sheet = await zip.file("xl/worksheets/sheet1.xml")!.async("string");

  // invoice date serial
  sheet = setCellNum(sheet, "A11", model.dateSerial);

  // line 1 -> row 14
  const l1 = model.lines[0];
  sheet = setCellNum(sheet, "D14", l1.qty);
  sheet = setCellNum(sheet, "E14", l1.unitPrice);
  sheet = setCellNum(sheet, "F14", l1.amount);

  // line 2 -> row 15 (or clear)
  const l2 = model.lines[1];
  if (l2) {
    sheet = setCellNum(sheet, "D15", l2.qty);
    sheet = setCellNum(sheet, "E15", l2.unitPrice);
    sheet = setCellNum(sheet, "F15", l2.amount);
  } else {
    sheet = clearCell(sheet, "D15");
    sheet = clearCell(sheet, "E15");
    sheet = clearCell(sheet, "F15");
  }

  // totals (formulas kept; cached values refreshed)
  sheet = setCellNum(sheet, "F23", model.subtotal);
  sheet = setCellNum(sheet, "F24", model.gst);
  sheet = setCellNum(sheet, "F25", model.total);

  // account number (numeric cell B30)
  const acctNum = Number(header.accountNumber.replace(/\D/g, ""));
  if (!Number.isNaN(acctNum) && header.accountNumber.trim() !== "") {
    sheet = setCellNum(sheet, "B30", acctNum);
  }

  zip.file("xl/worksheets/sheet1.xml", sheet);

  return zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    compression: "DEFLATE",
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
