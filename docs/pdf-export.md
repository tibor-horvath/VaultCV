# PDF export

After a visitor unlocks your CV, they can download a print-ready **PDF** (A4, client-side) from the **Download PDF** control in the basics card header on the main CV view. Use the same access flow as the rest of the site (for example `/?t=TOKEN` or a stored session).

The export is generated in the browser with **html2canvas** and **jsPDF**; link regions in the PDF are preserved where the browser capture allows.

In **production**, the **`/cv/pdf`** path **redirects to `/`**. There is no separate export screen at that URL—visitors are not expected to open, bookmark, or share `/cv/pdf`. The PDF file itself is still produced from the main CV when someone uses **Download PDF** (the print layout is rendered off-screen for capture).

In **local development** only, the app still serves **`/cv/pdf`** (optional **`?preview=1`** for a mock CV layout without calling the API) so you can work on the print layout.
