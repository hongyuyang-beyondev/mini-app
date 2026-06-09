# ANY'S Tax Invoice — mini app

Phone-friendly static app that generates a GST tax invoice from three inputs and
downloads an `.xlsx` that is byte-identical to the original template (same fonts,
borders, logo, layout) with only the values changed.

## How it works

You enter:

- **Invoice Date** → drives the invoice number (`#YYYYMMDD`) and the date cell.
- **Unit Price** (e.g. 550)
- **Total ex-GST** — the line-item subtotal (e.g. 2330)
- **Description** (default `Maintenance Labour`, editable)

The app splits the subtotal into the template's two-line shape:

```
fullUnits = floor(subtotal / unitPrice)      → line 1 (qty × unitPrice)
remainder = subtotal − fullUnits × unitPrice → line 2 (qty 1 × remainder)
GST       = subtotal / 10
Total     = subtotal + GST
```

Company / bank details (ABN, Bill To, account name, BSB, account number) live in
a collapsible section with the template's defaults, editable when needed.

Download is produced entirely in the browser: `public/template.xlsx` is loaded
with JSZip and only the changing cells / shared strings are patched, so styling
and the embedded layout are preserved exactly.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # -> dist/
```

## Deploy to Cloudflare Pages

- **Framework preset:** None / Vite
- **Build command:** `npm run build`
- **Build output directory:** `dist`

No environment variables or backend needed — it's fully static.

## Tech

React + Vite + TypeScript, Tailwind CSS, shadcn/ui components, JSZip.
