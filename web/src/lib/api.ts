import type { CvData } from '../types/cv'

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string }

function getMockCv(): CvData {
  return {
    basics: {
      name: 'John Doe',
      headline: 'Full‑stack Developer · React · Azure',
      email: 'john.doe@example.com',
      photoAlt: 'Profile photo',
      location: 'City, Country',
      summary:
        'This is mock data used for local development. Replace it by configuring CV_JSON in Azure Static Web Apps app settings (or api/local.settings.json locally).',
    },
    links: [
      { label: 'GitHub', url: 'https://github.com/your-handle' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/your-handle/' },
    ],
    credentials: [
      {
        issuer: 'microsoft',
        label: 'Microsoft Learn profile',
        url: 'https://learn.microsoft.com/',
      },
      {
        issuer: 'microsoft',
        label: 'Certification transcript',
        url: 'https://learn.microsoft.com/',
      },
      {
        issuer: 'aws',
        label: 'AWS Certified Developer – Associate',
        url: 'https://aws.amazon.com/certification/',
      },
      {
        issuer: 'google',
        label: 'Google Cloud Skills Boost profile',
        url: 'https://www.cloudskillsboost.google/',
      },
      {
        issuer: 'language',
        label: 'Cambridge English C1 Advanced (CAE)',
        url: 'https://www.cambridgeenglish.org/exams-and-tests/advanced/',
      },
    ],
    skills: ['React', 'TypeScript', 'Azure', 'Node.js', 'CI/CD'],
    languages: ['English (C1)', 'Czech (Native)'],
    experience: [
      {
        company: 'Example Co.',
        companyUrl: 'https://example.com',
        companyLinkedInUrl: 'https://www.linkedin.com/company/example-co/',
        skills: ['React', 'TypeScript', 'Azure'],
        role: 'Software Engineer',
        start: '2023',
        end: '2026',
        location: 'Remote',
        highlights: [
          'Built a token-gated CV SPA to keep personal data off the public web bundle.',
          'Shipped a modern UI system with accessible components and fast builds.',
        ],
      },
      {
        company: 'Contoso',
        companyUrl: 'https://www.microsoft.com/',
        companyLinkedInUrl: 'https://www.linkedin.com/company/microsoft/',
        skills: ['Node.js', 'React', 'AWS'],
        role: 'Full-stack Developer',
        start: '2021',
        end: '2023',
        location: 'City, Country',
        highlights: [
          'Delivered React + TypeScript features with a focus on performance and accessibility.',
          'Improved developer experience via tooling, CI, and reusable UI components.',
        ],
      },
    ],
    projects: [
      {
        name: 'Private CV SPA',
        description: 'React SPA + Azure Functions API protected by a QR-carried token.',
        links: [{ label: 'Source', url: 'https://github.com/your-handle/cv' }],
        tags: ['React', 'Azure', 'Functions'],
      },
    ],
    education: [
      {
        school: 'Example University',
        program: 'BSc Computer Science',
        start: '2019',
        end: '2023',
        location: 'City, Country',
      },
    ],
  }
}

export async function fetchCv(token: string): Promise<ApiResult<CvData>> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_CV === '1') {
    return { ok: true, data: getMockCv() }
  }

  const url = `/api/cv?t=${encodeURIComponent(token)}`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
    })
  } catch {
    return { ok: false, status: 0, message: 'Network error' }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      // ignore
    }
    return { ok: false, status: res.status, message }
  }

  try {
    const data = (await res.json()) as CvData
    if (!data?.basics?.name || !data?.basics?.headline) {
      return { ok: false, status: 500, message: 'CV payload is missing basics.' }
    }
    return { ok: true, data }
  } catch {
    return { ok: false, status: 500, message: 'Invalid JSON response.' }
  }
}

