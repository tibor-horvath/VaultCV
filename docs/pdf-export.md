# PDF export

After a visitor unlocks your CV, they can download a print-ready **PDF** (A4, client-side) from the **Download PDF** control in the basics card header on the main CV view. Use the same access flow as the rest of the site (for example `/?t=TOKEN` or a stored session).

The export is generated in the browser with **html2canvas** and **jsPDF**; link regions in the PDF are preserved where the browser capture allows.

The print layout is always rasterized at a **fixed width (794px, A4 content at ~96dpi)** so page breaks match desktop even on a narrow phone. Without that, a mobile viewport would reflow the HTML much taller and inflate the PDF page count.

Page splits use vertical slice positions aligned to **`data-pdf-page-break`** markers in the print DOM. Sections such as experience, projects, credentials, and education add markers on logical sub-blocks (titles, link rows, date rows, bullet lists, tag rows, issuer group headers, etc.) so cuts prefer boundaries instead of splitting a single card down the middle when content is taller than one printed page.

**Profile photos hosted remotely** (for example Azure Blob Storage) must be served with **CORS** allowing your site’s origin — otherwise the image can appear on the page but be **blank in the PDF**, because canvas capture requires a CORS-enabled image request. Configure blob CORS for your Static Web App URL (see [deployment-azure.md](deployment-azure.md) troubleshooting). The site’s Content Security Policy already allows `img-src` for `https://*.blob.core.windows.net`.

In **production**, the **`/cv/pdf`** path **redirects to `/`**. There is no separate export screen at that URL—visitors are not expected to open, bookmark, or share `/cv/pdf`. The PDF file itself is still produced from the main CV when someone uses **Download PDF** (the print layout is rendered off-screen for capture).

In **local development** only, the app still serves **`/cv/pdf`** (optional **`?preview=1`** for a mock CV layout without calling the API) so you can work on the print layout.
