# CV JSON schema (overview)

You control the CV content via Azure Blob Storage. The API reads a JSON blob selected by `{CV_PROFILE_SLUG}` + `{locale}`.

> **Not familiar with JSON?** JSON is a plain-text data format that looks like `{"key": "value"}`. You can write it in any text editor. Use [jsonlint.com](https://jsonlint.com) to check your JSON for errors before pasting it into Azure.

Key fields:

- `basics`: `{ name, headline, email?, mobile?, location?, summary?, photoAlt? }`
  - `mobile` is optional; prefer international format (for example `+36...`).
  - In the web CV view, `mobile` is hidden by default and shown only after the visitor clicks **Reveal phone**.
  - `photoAlt` is optional and used as the `alt` attribute for the profile image (defaults to `{name} profile photo`).
  - The profile photo itself is uploaded and managed via the admin editor (`/admin/editor` → Basics → **Upload photo**). `basics.photoUrl` is set automatically based on whether an image has been uploaded and the public visibility toggle is on.
- `links`: only **GitHub** and **LinkedIn** are rendered in the header right now
- `credentials`: array of `{ issuer, label, url, dateEarned?, dateExpires? }` where `issuer` is one of `microsoft | aws | google | school | language | other`
- `languages`: string array, shown as chips
- `skills`: optional top-level string array (general skill chips; separate from per-job skills on `experience`)
- `hobbiesInterests`: optional string array (chips) for a **Hobbies & interests** section. Omit or use an empty array to hide the section.
- `awards`: optional array of `{ title, issuer?, year? }` for **Honors & awards** (standalone entries; separate from the per-degree `honors` string on `education` rows). Omit or empty array hides the section.
- `sectionOrder`: optional string array controlling section render order on the **landing page**, **`/cv`**, and in **PDF export** (same order everywhere).
  - Valid keys: `credentials`, `skillsLanguages`, `links`, `experience`, `projects`, `education`, `hobbiesInterests`, `honorsAwards`
  - Section keys `hobbiesInterests` and `honorsAwards` refer to the `hobbiesInterests` and `awards` arrays respectively.
  - `skillsLanguages` controls both skills and languages as a pair.
  - `links` is kept for compatibility but links still render in the Basics card.
  - If missing or invalid, the app uses a canonical default: `credentials`, `skillsLanguages`, `experience`, `projects`, `education`, `hobbiesInterests`, `honorsAwards`. Unknown keys are dropped; any keys not listed are appended at the end in that default order.
- `experience`: supports `links?` as an array of `{ label, url }` (same shape as other link collections) and `skills?` to show per-job skill chips
- `education`: optional array of degrees — `{ school, program, ... }` with optional `schoolUrl`, `degree`, `field`, dates, `gpa`, `highlights`, etc.
- `projects`: array of `{ name, description, links?, tags? }`. In each `links` entry, `label` + `url`:
  - Labels **`github`** and **`web`** (case-insensitive) render as a **GitHub** or **globe** icon next to the project name (icon links to `url`).
  - Any other label is shown as a text link under the project (with tags).

## Example

Below is a single JSON object (the file content you upload to Blob as `{slug}-private-profile-{locale}.json`). Omit sections you do not need. `basics.photoUrl` is managed automatically by the API based on whether a profile image has been uploaded.

```json
{
  "basics": {
    "name": "Jane Smith",
    "headline": "Senior Software Engineer · TypeScript · Azure",
    "email": "jane@example.com",
    "mobile": "+49 1512 3456789",
    "location": "Berlin, Germany",
    "summary": "Short paragraph about your focus and what you are looking for.",
    "photoAlt": "Jane Smith professional headshot"
  },
  "links": [
    { "label": "GitHub", "url": "https://github.com/your-handle" },
    { "label": "LinkedIn", "url": "https://www.linkedin.com/in/your-handle/" }
  ],
  "sectionOrder": [
    "credentials",
    "skillsLanguages",
    "experience",
    "projects",
    "education",
    "hobbiesInterests",
    "honorsAwards",
    "links"
  ],
  "skills": ["TypeScript", "React", "Azure", "Node.js"],
  "languages": ["English", "German"],
  "hobbiesInterests": ["Photography", "Trail running"],
  "awards": [
    { "title": "Employee of the Year", "issuer": "Example Co.", "year": "2024" },
    { "title": "Regional hackathon — 2nd place", "year": "2023" }
  ],
  "credentials": [
    {
      "issuer": "microsoft",
      "label": "Azure Developer Associate",
      "url": "https://learn.microsoft.com/",
      "dateEarned": "2024-06"
    },
    {
      "issuer": "aws",
      "label": "AWS Certified Developer – Associate",
      "url": "https://aws.amazon.com/certification/",
      "dateEarned": "2023-01",
      "dateExpires": "2026-01"
    },
    {
      "issuer": "school",
      "label": "Example University - Data Engineering Certificate",
      "url": "https://www.example.edu/certificates/data-engineering",
      "dateEarned": "2022-12"
    }
  ],
  "experience": [
    {
      "company": "Example Co.",
      "links": [
        { "label": "website", "url": "https://example.com" },
        { "label": "linkedin", "url": "https://www.linkedin.com/company/example-co/" }
      ],
      "role": "Software Engineer",
      "start": "2022",
      "end": "2026",
      "location": "Remote",
      "skills": ["React", "TypeScript", "Azure"],
      "highlights": [
        "Led migration of a customer-facing app to Azure Static Web Apps.",
        "Introduced token-gated access for sensitive profile data."
      ]
    }
  ],
  "education": [
    {
      "school": "Example University",
      "schoolUrl": "https://www.example.edu/",
      "degree": "MSc",
      "field": "Computer Science",
      "program": "MSc Computer Science",
      "start": "2018",
      "end": "2020",
      "location": "Example City",
      "highlights": ["Thesis on distributed systems."]
    }
  ],
  "projects": [
    {
      "name": "Portfolio API",
      "description": "Serverless API that serves localized CV JSON behind a session cookie.",
      "links": [
        { "label": "github", "url": "https://github.com/your-handle/cv" },
        { "label": "web", "url": "https://your-site.example.com" },
        { "label": "Docs", "url": "https://github.com/your-handle/cv/blob/main/README.md" }
      ],
      "tags": ["Azure Functions", "TypeScript"]
    }
  ]
}
```

The `/api/cv` handler does not deeply validate the JSON schema; the web app validates payloads it displays. Optional keys such as `hobbiesInterests` and `awards` can be omitted entirely from blob JSON.

For local development, configure `CV_PROFILE_SLUG`, `CV_PROFILE_STORAGE_CONNECTION_STRING`, and `CV_PROFILE_CONTAINER` (see [local-development.md](local-development.md)).
