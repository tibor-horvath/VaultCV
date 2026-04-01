# PDF export

After a visitor unlocks your CV, they can download a print-ready **PDF** (A4, client-side) from the **Download PDF** control in the basics card header on the main CV view. Use the same access flow as the rest of the site (share link or stored session).

Contact rows in the PDF header currently include email and social/profile links. Phone reveal behavior is web-only (the PDF does not include the `basics.mobile` reveal interaction).

The export is generated in the browser with **html2canvas** and **jsPDF**; link regions in the PDF are preserved where the browser capture allows.

The print layout is always rasterized at a **fixed width (794px, A4 content at ~96dpi)** so page breaks match desktop even on a narrow phone. Without that, a mobile viewport would reflow the HTML much taller and inflate the PDF page count.

Page splits use vertical slice positions aligned to **`data-pdf-page-break`** markers in the print DOM. Sections such as experience, projects, credentials, and education add markers on logical sub-blocks (titles, link rows, date rows, bullet lists, tag rows, issuer group headers, etc.) so cuts prefer boundaries instead of splitting a single card down the middle when content is taller than one printed page.

**Profile photos hosted remotely** (for example Azure Blob Storage) must be served with **CORS** allowing your site’s origin. Before capture, the app **fetches** the image and inlines it as a data URL so **html2canvas** does not depend on a second load (which often fails or shows blank on **mobile Safari**). That fetch needs **CSP `connect-src`** for `https://*.blob.core.windows.net` (in `staticwebapp.config.json`) and correct blob CORS. See [deployment-azure.md](deployment-azure.md). On narrow viewports the raster **scale** is slightly reduced to avoid iOS canvas limits that can drop images.

In **production**, the **`/cv/pdf`** path **redirects to `/`**. There is no separate export screen at that URL—visitors are not expected to open, bookmark, or share `/cv/pdf`. The PDF file itself is still produced from the main CV when someone uses **Download PDF** (the print layout is rendered off-screen for capture).

In **local development** only, the app still serves **`/cv/pdf`** (optional **`?preview=1`** for a mock CV layout without calling the API) so you can work on the print layout.
