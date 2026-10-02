# PDF export

After a visitor unlocks your CV, they can download it as an A4 **PDF** (generated client-side) from the **Download PDF** split button in the toolbar on the main CV view. Use the same access flow as the rest of the site (share link or stored session).

There are two layouts. The **chevron** opens a chooser that only *selects* one; the **main button** downloads the selected layout and names it ("Download PDF · Modern"). The choice is remembered per browser in `localStorage` (`cv_pdf_variant`, see `web/src/lib/pdfVariant.ts`); the default is **Modern**. On phones there is no room for the chevron, so the main button opens the chooser as a bottom sheet and picking a layout there downloads it.

| | Modern (`modern`) | Print-friendly (`print`) |
|---|---|---|
| Made for | Saving, emailing, reading on screen | Paper and applicant tracking systems |
| Look | Full-height Vault Ink sidebar, Key Indigo accent, timeline, chips | White page, one dark accent, no icons, pills or tinted blocks |
| Links | Email (`mailto:`), phone (`tel:`), profiles, employers, schools, projects and credential **Verify** links | None besides the generated-by line |
| Code | `web/src/components/cv/pdf/modern/`, `web/src/lib/pdf/modernStyles.ts` | `web/src/components/cv/pdf/document/`, `web/src/lib/pdf/styles.ts` |

Rules both layouts share:

- **Expired credentials are hidden.** A credential whose `dateExpires` has passed at generation time is left out (`web/src/lib/pdf/credentials.ts`). Partial dates run to the end of their period: `2026-03` is valid through March 2026.
- **Work history first.** When the profile has no `sectionOrder`, the PDF uses an employer-first default (`PRINT_SECTION_ORDER` in `web/src/lib/sectionOrder.ts`). An explicit `sectionOrder` is respected as-is. In the modern layout credentials, skills and languages always sit in the sidebar; the other sections keep their order in the main column.
- Every page carries the name and a page number, and continuation pages repeat who the CV belongs to (print: a running head; modern: name, role and email at the foot of the sidebar). The last page ends with the "Generated on … by VaultCV" line.

### Print layout

- **No CV links.** Profile, credential, company, school and project URLs stay on the web CV; on paper they cannot be clicked. The header lists email, phone (`basics.mobile`) and location as plain text, and the repository URL in the generated-by line is the document's only link.

### Modern layout

- **Only web links become annotations.** URLs go through `pdfWebHref` (`web/src/lib/pdf/links.ts`), which keeps `http:`/`https:` only; anything else prints as plain text. Email and phone become `mailto:`/`tel:` links.
- The sidebar background is a `fixed` backdrop, so it runs the full height of every page. The sidebar's content flows like the main column: an unusually long sidebar continues onto page 2.
- Short sections (honors & awards, interests) are kept whole: `minPresenceAhead` alone did not keep a heading with a grid of `wrap={false}` cards.
- A `Link` placed directly under a `render` prop is not drawn. Nest it in a `<Text>`, as the running head and the footer do.

## How it is generated

The export is produced in the browser with **[@react-pdf/renderer](https://react-pdf.org/)**, which lays out a React tree of PDF primitives and writes a **vector** PDF directly.

This means the output has **selectable, searchable, copyable text** and is parseable by applicant tracking systems.

> Previously the PDF was produced by rasterizing the DOM with html2canvas and stamping PNG slices into the page with jsPDF, with invisible clickable rectangles overlaid at measured coordinates. That output contained no text at all — only images.

The print layout lives in `web/src/components/cv/pdf/document/`:

- `CvPdfDocument.tsx` — the `<Document>`/`<Page>` shell, section dispatch and footer.
- `sections.tsx` / `PdfHeader.tsx` — one component per CV section.
- `primitives.tsx` — shared building blocks (gutter row, dated entry, compact list row, bullets).
- `format.ts` — date and credential formatting, shared with the modern layout.

The modern layout lives in `web/src/components/cv/pdf/modern/` (`ModernCvPdfDocument.tsx`, `ModernSidebar.tsx`, `modernSections.tsx`). `renderCvPdfBlob` picks the document for the requested variant; both take the same props.

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

`tests/cvPdfDocument.node.test.tsx` and `tests/modernCvPdfDocument.node.test.tsx` guard this by decoding the text of each rendered page and asserting headings sit on the same page as their first entry.

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

In **local development** only, `/cv/pdf` renders a live **`<PDFViewer>`** of the actual document (optional **`?preview=1`** for a mock CV without calling the API, and **`?variant=modern|print`**, or the toggle above the viewer, to pick the layout), which is the fastest way to iterate on the layout.
