# PDF export

After a visitor unlocks your CV, they can download a print-ready **PDF** (A4, client-side) from the **Download PDF** control in the basics card header on the main CV view. Use the same access flow as the rest of the site (share link or stored session).

The PDF is designed for employers and for paper: a white page, one dark accent that still reads as solid ink in grayscale, and no icons, pills or tinted blocks.

- **No CV links.** Profile, credential, company, school and project URLs stay on the web CV; on paper they cannot be clicked. The header lists email, phone (`basics.mobile`) and location as plain text.
- **Expired credentials are hidden.** A credential whose `dateExpires` has passed at generation time is left out (`web/src/lib/pdf/credentials.ts`). Partial dates run to the end of their period: `2026-03` is valid through March 2026.
- **Work history first.** When the profile has no `sectionOrder`, the PDF uses an employer-first default (`PRINT_SECTION_ORDER` in `web/src/lib/sectionOrder.ts`). An explicit `sectionOrder` is respected as-is.
- Every page carries the name and a page number; continuation pages repeat name, role and email at the top in case pages get separated. The last page ends with the "Generated on … by VaultCV" line, whose repository URL is the document's only link.

## How it is generated

The export is produced in the browser with **[@react-pdf/renderer](https://react-pdf.org/)**, which lays out a React tree of PDF primitives and writes a **vector** PDF directly.

This means the output has **selectable, searchable, copyable text** and is parseable by applicant tracking systems.

> Previously the PDF was produced by rasterizing the DOM with html2canvas and stamping PNG slices into the page with jsPDF, with invisible clickable rectangles overlaid at measured coordinates. That output contained no text at all — only images.

The document lives in `web/src/components/cv/pdf/document/`:

- `CvPdfDocument.tsx` — the `<Document>`/`<Page>` shell, section dispatch and footer.
- `sections.tsx` / `PdfHeader.tsx` — one component per CV section.
- `primitives.tsx` — shared building blocks (gutter row, dated entry, compact list row, bullets).

Every section uses the same two-column grid: a narrow left gutter for the section label (or an entry's dates and place) and the content beside it.

Styling lives in `web/src/lib/pdf/styles.ts` and `tokens.ts`. Sizes are CSS px measured against the full A4 sheet (794 × 1123 px at 96dpi), converted with `pt()`; body text is 14px (10.5pt) and nothing is smaller than 12px (9pt) apart from the generated-by line.

## Fonts

**Inter** (400/600/700) is embedded from `web/src/assets/fonts/`. Embedding is **required, not cosmetic**: react-pdf's built-in Helvetica is WinAnsi-encoded and renders `ő` (U+0151) and `ű` (U+0171) as wrong glyphs *without raising an error*, silently corrupting Hungarian names. Embedding also makes output identical on every machine, which the old system-font rasterization never was.

If a monospace font is ever reintroduced, avoid JetBrains Mono: its programming ligatures (`://`) crash react-pdf's bundled fontkit.

Hyphenation is disabled (`Font.registerHyphenationCallback`); long URLs break only after punctuation. See `web/src/lib/pdf/lineBreak.ts`.

## Pagination

react-pdf paginates content itself — there is no manual slicing. Two rules matter:

- **`wrap={false}`** makes a block atomic. It is applied only to short blocks (bullets, project entries, credential and award rows, one-line sections), because react-pdf **clips**, rather than paginates, a `wrap={false}` block taller than one page.
- A heading must never be stranded at the foot of a page. Gutter labels share a row with their content, so they cannot be. The full-width headings above dated entries (experience, education) use `minPresenceAhead`, as does each entry's title line.

`tests/cvPdfDocument.node.test.tsx` guards this by decoding the text of each rendered page and asserting headings sit on the same page as their first entry.

## Content Security Policy

`script-src` must include **`'wasm-unsafe-eval'`** (in `staticwebapp.config.json`): react-pdf's layout engine (`yoga-layout` v3) instantiates a WebAssembly module at render time, and a stricter `script-src` makes the browser refuse to compile it. The renderer then aborts inside an async callback and `pdf().toBlob()` **never settles**, leaving **Download PDF** stuck on "Generating…" with no error. Do not widen this to `'unsafe-eval'`.

The Vite dev server sends no CSP, so this fails only on deployed builds. `tests/staticwebappCsp.node.test.ts` guards the directive.

## Profile photos

**Remotely hosted photos** (for example Azure Blob Storage) must be served with **CORS** allowing your site's origin. The app **fetches** the image and inlines it as a downscaled JPEG data URL before rendering.

This is deliberate: letting react-pdf's `<Image>` fetch the URL itself would abort the *entire* render on any CORS or network failure, and would embed the full-resolution original. Pre-resolving degrades to an initials monogram instead of losing the PDF. That fetch needs **CSP `connect-src`** for `https://*.blob.core.windows.net` (in `staticwebapp.config.json`) and correct blob CORS. See [deployment-azure.md](deployment-azure.md).

**Same-origin photos** — the default, where `/api/cv` returns `photoUrl: '/api/private-profile/image'` — are fetched with `credentials: 'same-origin'` so the HttpOnly `cv_session` cookie is sent; without it that endpoint answers `401` and the photo degrades to the initials monogram. Cross-origin URLs stay uncredentialed, which `Access-Control-Allow-Origin: *` requires.

Without a usable photo the header prints the candidate's initials in a neutral square. (The web fallback is an SVG data URL, which react-pdf's `<Image>` cannot decode.)

## Bundle impact

`@react-pdf/renderer` is loaded through a dynamic `import()` in `web/src/lib/downloadCvPdf.ts` and lands in its own chunk, so it is fetched only when a visitor actually clicks **Download PDF**. Nothing in the initial bundle may import the document components or `lib/pdf/fonts.ts`.

`web/src/App.tsx` therefore lazy-loads `CvPdfRoute`, which imports `PDFViewer` eagerly for the dev preview.

> `pako` is a direct dependency because `@react-pdf/pdfkit`'s browser build imports `pako/lib/zlib/*` without declaring it. It must stay on **v1** — v2 restructured those paths away.

## Routes

In **production**, the **`/cv/pdf`** path **redirects to `/`**. There is no separate export screen at that URL — visitors are not expected to open, bookmark, or share `/cv/pdf`. The PDF is produced from the main CV via **Download PDF**.

In **local development** only, `/cv/pdf` renders a live **`<PDFViewer>`** of the actual document (optional **`?preview=1`** for a mock CV without calling the API), which is the fastest way to iterate on the layout.
