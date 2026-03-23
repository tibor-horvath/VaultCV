import type { CvData } from '../types/cv'

export function getMockCv(): CvData {
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
        dateEarned: '2024-01',
      },
      {
        issuer: 'microsoft',
        label: 'Certification transcript',
        url: 'https://learn.microsoft.com/',
        dateEarned: '2024-03',
        dateExpires: '2026-03',
      },
      {
        issuer: 'aws',
        label: 'AWS Certified Developer – Associate',
        url: 'https://aws.amazon.com/certification/',
        dateEarned: '2023-06',
        dateExpires: '2026-06',
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
        dateEarned: '2020-09',
      },
    ],
    skills: ['React', 'TypeScript', 'Azure', 'Node.js', 'CI/CD'],
    languages: ['English (C1)', 'Czech (Native)'],
    experience: [
      {
        id: 'exp-example-co',
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
        id: 'exp-contoso',
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
        links: [
          { label: 'github', url: 'https://github.com/your-handle/cv' },
          { label: 'web', url: 'https://example.com' },
        ],
        tags: ['React', 'Azure', 'Functions'],
      },
    ],
    education: [
      {
        id: 'edu-example-uni-bsc',
        school: 'Example University',
        program: 'BSc Computer Science',
        start: '2019',
        end: '2023',
        location: 'City, Country',
      },
    ],
  }
}
