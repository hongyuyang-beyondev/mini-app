import { formatMoney, type InvoiceModel } from "@/lib/invoice";
import type { HeaderInfo } from "@/lib/xlsx";

function formatDate(serial: number): string {
  const ms = (serial - 25569) * 86400000; // Excel serial -> unix
  const d = new Date(ms);
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function InvoicePreview({
  model,
  header,
}: {
  model: InvoiceModel;
  header: HeaderInfo;
}) {
  return (
    <div className="rounded-lg border bg-white p-5 text-[13px] text-slate-800 shadow-sm">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-bold tracking-wide">
            {header.businessName}
          </div>
          <div className="mt-1 text-xs text-slate-500">ABN:{header.abn}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold tracking-widest text-slate-900">
            INVOICE
          </div>
          <div className="text-xs text-slate-500">{model.invoiceNumber}</div>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-600">Bill To:{header.billTo}</div>

      <div className="mt-3">
        <div className="text-[11px] font-semibold uppercase text-slate-400">
          Invoice Date
        </div>
        <div className="text-sm font-medium">
          {formatDate(model.dateSerial)}
        </div>
      </div>

      {/* line items */}
      <table className="mt-4 w-full border-collapse text-xs">
        <thead>
          <tr className="border-y border-slate-300 text-slate-500">
            <th className="py-1.5 text-left font-semibold">Description</th>
            <th className="py-1.5 text-right font-semibold">Qty</th>
            <th className="py-1.5 text-right font-semibold">Unit</th>
            <th className="py-1.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {model.lines.map((l, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-1.5 pr-2">{l.description}</td>
              <td className="py-1.5 text-right tabular-nums">{l.qty}</td>
              <td className="py-1.5 text-right tabular-nums">
                {formatMoney(l.unitPrice)}
              </td>
              <td className="py-1.5 text-right tabular-nums">
                {formatMoney(l.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* totals */}
      <div className="mt-3 ml-auto w-44 space-y-1 text-xs">
        <Row label="Subtotal" value={model.subtotal} />
        <Row label="GST (10%)" value={model.gst} />
        <div className="flex justify-between border-t border-slate-300 pt-1 text-sm font-bold">
          <span>Total</span>
          <span className="tabular-nums">${formatMoney(model.total)}</span>
        </div>
      </div>

      {/* payment */}
      <div className="mt-5 border-t border-dashed border-slate-200 pt-3 text-[11px] text-slate-600">
        <div className="font-semibold text-slate-700">Payment Options</div>
        <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          <span className="text-slate-400">Account Name:</span>
          <span>{header.accountName}</span>
          <span className="text-slate-400">BSB:</span>
          <span>{header.bsb}</span>
          <span className="text-slate-400">Account Number:</span>
          <span>{header.accountNumber}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span className="tabular-nums">${formatMoney(value)}</span>
    </div>
  );
}
