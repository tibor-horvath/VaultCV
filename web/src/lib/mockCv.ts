import type { LocalizedCvData } from '../types/localization'
import type { Locale } from './i18n'

function getMockCvEn(): LocalizedCvData {
  return {
    locale: 'en',
    basics: {
      name: 'John Doe',
      headline: 'Full‑stack Developer · React · Azure',
      email: 'john.doe@example.com',
      photoAlt: 'Profile photo',
      location: 'City, Country',
      summary:
        'This is mock data used for local development. Replace it by configuring PRIVATE_PROFILE_JSON in Azure Static Web Apps app settings (or api/local.settings.json locally).',
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
        issuer: 'school',
        label: 'Example University - Data Engineering Certificate',
        url: 'https://example.edu/certificates/data-engineering',
        dateEarned: '2022-12',
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
        schoolUrl: 'https://example.edu/',
        degree: 'BSc',
        field: 'Computer Science',
        program: 'Software Engineering concentration',
        start: '2019',
        end: '2023',
        location: 'City, Country',
        gpa: '3.8/4.0',
        honors: 'summa cum laude',
      },
    ],
  }
}

function getMockCvHu(): LocalizedCvData {
  return {
    locale: 'hu',
    basics: {
      name: 'John Doe',
      headline: 'Full-stack Fejlesztő · React · Azure',
      email: 'john.doe@example.com',
      photoAlt: 'Profilkép',
      location: 'Város, Ország',
      summary:
        'Ez mock adat helyi fejlesztéshez. Cseréld le a PRIVATE_PROFILE_JSON beállítással az Azure Static Web Apps app settingsben (vagy lokálisan az api/local.settings.json-ben).',
    },
    links: [
      { label: 'GitHub', url: 'https://github.com/your-handle' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/your-handle/' },
    ],
    credentials: [
      {
        issuer: 'microsoft',
        label: 'Microsoft Learn profil',
        url: 'https://learn.microsoft.com/',
        dateEarned: '2024-01',
      },
      {
        issuer: 'microsoft',
        label: 'Tanúsítvány kivonat',
        url: 'https://learn.microsoft.com/',
        dateEarned: '2024-03',
        dateExpires: '2026-03',
      },
      {
        issuer: 'aws',
        label: 'AWS Certified Developer - Associate',
        url: 'https://aws.amazon.com/certification/',
        dateEarned: '2023-06',
        dateExpires: '2026-06',
      },
      {
        issuer: 'google',
        label: 'Google Cloud Skills Boost profil',
        url: 'https://www.cloudskillsboost.google/',
      },
      {
        issuer: 'school',
        label: 'Example University - Data Engineering tanúsítvány',
        url: 'https://example.edu/certificates/data-engineering',
        dateEarned: '2022-12',
      },
      {
        issuer: 'language',
        label: 'Cambridge English C1 Advanced (CAE)',
        url: 'https://www.cambridgeenglish.org/exams-and-tests/advanced/',
        dateEarned: '2020-09',
      },
    ],
    skills: ['React', 'TypeScript', 'Azure', 'Node.js', 'CI/CD'],
    languages: ['Angol (C1)', 'Magyar (Anyanyelvi)'],
    experience: [
      {
        id: 'exp-example-co',
        company: 'Example Co.',
        companyUrl: 'https://example.com',
        companyLinkedInUrl: 'https://www.linkedin.com/company/example-co/',
        skills: ['React', 'TypeScript', 'Azure'],
        role: 'Szoftvermérnök',
        start: '2023',
        end: '2026',
        location: 'Remote',
        highlights: [
          'Tokennel védett CV SPA-t építettem, hogy a személyes adatok ne kerüljenek nyilvános web bundle-be.',
          'Modern UI rendszert szállítottam akadálymentes komponensekkel és gyors builddel.',
        ],
      },
      {
        id: 'exp-contoso',
        company: 'Contoso',
        companyUrl: 'https://www.microsoft.com/',
        companyLinkedInUrl: 'https://www.linkedin.com/company/microsoft/',
        skills: ['Node.js', 'React', 'AWS'],
        role: 'Full-stack Fejlesztő',
        start: '2021',
        end: '2023',
        location: 'Város, Ország',
        highlights: [
          'React + TypeScript funkciókat szállítottam teljesítmény és akadálymentesség fókuszban.',
          'Javítottam a fejlesztői élményt toolinggal, CI-vel és újrafelhasználható UI komponensekkel.',
        ],
      },
    ],
    projects: [
      {
        name: 'Private CV SPA',
        description: 'React SPA + Azure Functions API QR tokenes védelemmel.',
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
        schoolUrl: 'https://example.edu/',
        degree: 'BSc',
        field: 'Számítástechnika',
        program: 'Szoftverfejlesztés specializáció',
        start: '2019',
        end: '2023',
        location: 'Város, Ország',
        gpa: '3,8/4,0',
        honors: 'Kitüntetéses diploma',
      },
    ],
  }
}

function getMockCvDe(): LocalizedCvData {
  return {
    locale: 'de',
    basics: {
      name: 'John Doe',
      headline: 'Full‑stack‑Entwickler · React · Azure',
      email: 'john.doe@example.com',
      photoAlt: 'Profilfoto',
      location: 'Stadt, Land',
      summary:
        'Dies sind Mock-Daten für die lokale Entwicklung. Ersetze sie durch PRIVATE_PROFILE_JSON in den Azure Static Web Apps App-Einstellungen (oder api/local.settings.json lokal).',
    },
    links: [
      { label: 'GitHub', url: 'https://github.com/your-handle' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/your-handle/' },
    ],
    credentials: [
      {
        issuer: 'microsoft',
        label: 'Microsoft Learn Profil',
        url: 'https://learn.microsoft.com/',
        dateEarned: '2024-01',
      },
      {
        issuer: 'microsoft',
        label: 'Zertifikatsauszug',
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
        label: 'Google Cloud Skills Boost Profil',
        url: 'https://www.cloudskillsboost.google/',
      },
      {
        issuer: 'school',
        label: 'Example University - Data Engineering Zertifikat',
        url: 'https://example.edu/certificates/data-engineering',
        dateEarned: '2022-12',
      },
      {
        issuer: 'language',
        label: 'Cambridge English C1 Advanced (CAE)',
        url: 'https://www.cambridgeenglish.org/exams-and-tests/advanced/',
        dateEarned: '2020-09',
      },
    ],
    skills: ['React', 'TypeScript', 'Azure', 'Node.js', 'CI/CD'],
    languages: ['Englisch (C1)', 'Deutsch (Muttersprache)'],
    experience: [
      {
        id: 'exp-example-co',
        company: 'Example Co.',
        companyUrl: 'https://example.com',
        companyLinkedInUrl: 'https://www.linkedin.com/company/example-co/',
        skills: ['React', 'TypeScript', 'Azure'],
        role: 'Softwareentwickler',
        start: '2023',
        end: '2026',
        location: 'Remote',
        highlights: [
          'Token-geschützte CV-SPA gebaut, damit persönliche Daten nicht im öffentlichen Web-Bundle landen.',
          'Modernes UI-System mit barrierefreien Komponenten und schnellen Builds geliefert.',
        ],
      },
      {
        id: 'exp-contoso',
        company: 'Contoso',
        companyUrl: 'https://www.microsoft.com/',
        companyLinkedInUrl: 'https://www.linkedin.com/company/microsoft/',
        skills: ['Node.js', 'React', 'AWS'],
        role: 'Full-Stack-Entwickler',
        start: '2021',
        end: '2023',
        location: 'Stadt, Land',
        highlights: [
          'React- und TypeScript-Features mit Fokus auf Performance und Barrierefreiheit geliefert.',
          'Developer Experience durch Tooling, CI und wiederverwendbare UI-Komponenten verbessert.',
        ],
      },
    ],
    projects: [
      {
        name: 'Private CV SPA',
        description: 'React-SPA mit Azure Functions API, geschützt per QR-Token.',
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
        schoolUrl: 'https://example.edu/',
        degree: 'BSc',
        field: 'Informatik',
        program: 'Schwerpunkt Software Engineering',
        start: '2019',
        end: '2023',
        location: 'Stadt, Land',
        gpa: '3,8/4,0',
        honors: 'mit Auszeichnung',
      },
    ],
  }
}

export function getMockCv(locale: Locale): LocalizedCvData {
  const base = locale.split('-')[0]?.toLowerCase() ?? 'en'
  if (base === 'hu') return getMockCvHu()
  if (base === 'de') return getMockCvDe()
  return getMockCvEn()
}
