# DataCanvas — What This Client-Only App Cannot Do

This project runs entirely in the browser — no backend, no server, no database. That's a deliberate choice, and it's what makes it free to run and simple to deploy. It also means a specific set of real BI-tool features are out of reach until that changes. This document names them plainly rather than leaving them to be discovered as silent gaps.

---

## Export is a raster capture, not native output

PDF and PowerPoint export (`lib/exportPdf.ts`, `lib/exportPptx.ts`) both work by rendering the dashboard to a canvas via `html2canvas` and embedding that image in the output file. What you get is a picture of the dashboard on a page or slide — not editable chart objects, not selectable text, not something you can reformat inside PowerPoint or Acrobat afterward.

**Excel export is the exception** — `lib/exportExcel.ts` writes real rows and columns via SheetJS, so a block's underlying data exports as genuine, editable spreadsheet data, not an image.

If native, editable PPTX chart objects matter enough to build, that's a real but substantially larger effort — re-implementing each chart type against `pptxgenjs`'s own chart API rather than rasterising — and worth scoping as its own piece of work rather than assumed to already be covered.

---

## Features that need a backend

| Feature | Why it's out of reach without one |
|---|---|
| **Scheduled data refresh** | Re-fetching or re-parsing a data source on a timer requires something running when nobody has the tab open — a server-side job, not a browser tab. |
| **Sharing / permissions / row-level security** | `localStorage` is per-browser, per-device. There's no mechanism for one person's dashboard to become visible to another person without a server and real user accounts sitting between them. |
| **True natural-language Q&A** | A heuristic parser can handle a handful of fixed phrasings ("show me X by Y"), but genuine natural-language understanding is backed by a trained model. Calling an LLM API safely means routing through a server-side proxy — an API key can never live in browser code. |
| **Real-time collaborative editing** | Multiple people editing one dashboard at once needs a sync layer — WebSockets or a CRDT — with real conflict resolution. `localStorage` has no concept of "another browser" at all. |

---

## If any of these become priorities

The honest next step is scoping a minimal backend deliberately — even a small one (a single API for auth plus shared storage would unlock sharing and permissions specifically, without requiring the full list above) — rather than attempting a client-only approximation that would end up misrepresenting what the app can actually do. Pretending to support sharing via a copyable `localStorage` export, for instance, would break the moment two people aren't on the same browser, and would cost more in confusion than it's worth.
