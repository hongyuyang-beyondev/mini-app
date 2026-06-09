import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { InvoicePreview } from "@/components/InvoicePreview";
import { DatePicker } from "@/components/DatePicker";
import { buildInvoice } from "@/lib/invoice";
import {
  DEFAULT_HEADER,
  downloadBlob,
  generateXlsx,
  type HeaderInfo,
} from "@/lib/xlsx";

function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function App() {
  const [date, setDate] = useState(todayIso());
  const [unitPrice, setUnitPrice] = useState("550");
  const [subtotal, setSubtotal] = useState("2330");
  const [description, setDescription] = useState("Maintenance Labour");
  const [header, setHeader] = useState<HeaderInfo>(DEFAULT_HEADER);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const model = useMemo(
    () =>
      buildInvoice({
        date,
        unitPrice: Number(unitPrice) || 0,
        subtotal: Number(subtotal) || 0,
        description,
      }),
    [date, unitPrice, subtotal, description]
  );

  const setHeaderField = (k: keyof HeaderInfo) => (v: string) =>
    setHeader((h) => ({ ...h, [k]: v }));

  async function handleDownload() {
    setError(null);
    setBusy(true);
    try {
      const blob = await generateXlsx(model, header);
      downloadBlob(blob, `ANY\`S发票${date.replace(/-/g, "")}.xlsx`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate file");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 pb-28 pt-6">
      <header className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">Tax Invoice</h1>
          <p className="text-xs text-muted-foreground">ANY'S · GST invoice</p>
        </div>
      </header>

      {/* inputs */}
      <Card>
        <CardContent className="space-y-4 pt-4">
          <Field label="Invoice Date">
            <DatePicker value={date} onChange={setDate} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit Price ($)">
              <Input
                type="number"
                inputMode="decimal"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="550"
              />
            </Field>
            <Field label="Total ex-GST ($)">
              <Input
                type="number"
                inputMode="decimal"
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value)}
                placeholder="2330"
              />
            </Field>
          </div>

          <Field label="Description">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Maintenance Labour"
            />
          </Field>

          {/* collapsible company / bank details */}
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-md bg-secondary px-3 py-2.5 text-sm font-medium text-secondary-foreground">
                <span>Company &amp; bank details</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    detailsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <Field label="ABN">
                <Input
                  value={header.abn}
                  onChange={(e) => setHeaderField("abn")(e.target.value)}
                />
              </Field>
              <Field label="Bill To">
                <Input
                  value={header.billTo}
                  onChange={(e) => setHeaderField("billTo")(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Account Name">
                  <Input
                    value={header.accountName}
                    onChange={(e) =>
                      setHeaderField("accountName")(e.target.value)
                    }
                  />
                </Field>
                <Field label="BSB">
                  <Input
                    value={header.bsb}
                    onChange={(e) => setHeaderField("bsb")(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Account Number">
                <Input
                  value={header.accountNumber}
                  onChange={(e) =>
                    setHeaderField("accountNumber")(e.target.value)
                  }
                />
              </Field>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* preview */}
      <div>
        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Preview
        </div>
        <InvoicePreview model={model} header={header} />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* sticky download bar */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <Button
            size="lg"
            className="w-full"
            onClick={handleDownload}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            Download .xlsx
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
