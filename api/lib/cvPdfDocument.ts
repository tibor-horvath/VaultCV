import PDFDocument from 'pdfkit'

type CvLink = {
  label: string
  url: string
}

type CvCredential = {
  issuer: string
  label: string
  url?: string
  dateEarned?: string
  dateExpires?: string
}

type CvExperience = {
  company: string
  links?: CvLink[]
  role: string
  start: string
  end?: string
  location?: string
  skills?: string[]
  highlights: string[]
}

type CvProject = {
  name: string
  description: string
  links?: CvLink[]
  tags?: string[]
}

type CvEducation = {
  school: string
  schoolUrl?: string
  degree?: string
  field?: string
  program: string
  start?: string
  end?: string
  location?: string
  gpa?: string
  honors?: string
  thesisTitle?: string
  advisor?: string
  highlights?: string[]
}

type CvAward = {
  title: string
  issuer?: string
  year?: string
}

type CvBasics = {
  name: string
  headline: string
  email?: string
  mobile?: string
  photoUrl?: string
  photoAlt?: string
  location?: string
  summary?: string
}

type CvData = {
  locale?: string
  basics: CvBasics
  links?: CvLink[]
  credentials?: CvCredential[]
  skills?: string[]
  languages?: string[]
  experience?: CvExperience[]
  projects?: CvProject[]
  education?: CvEducation[]
  hobbiesInterests?: string[]
  awards?: CvAward[]
  sectionOrder?: string[]
}

// --- Layout constants ---
const PAGE_MARGIN = 50
const PAGE_WIDTH = 595.28
const CONTENT_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN

const FONT_NAME = 'Helvetica'
const FONT_BOLD = 'Helvetica-Bold'

function sectionSeparator(doc: PDFKit.PDFDocument) {
  doc.moveDown(0.4)
  const y = doc.y
  doc
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, y)
    .lineWidth(0.5)
    .strokeColor('#cbd5e1')
    .stroke()
  doc.moveDown(0.5)
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string) {
  sectionSeparator(doc)
  doc
    .font(FONT_BOLD)
    .fontSize(11)
    .fillColor('#1e293b')
    .text(title.toUpperCase(), { characterSpacing: 0.8 })
  doc.moveDown(0.35)
}

function dateRange(start?: string, end?: string): string {
  if (!start && !end) return ''
  const s = start ?? ''
  const e = end ?? 'Present'
  return `${s} – ${e}`
}

function formatLinkLine(links: CvLink[]): string {
  return links
    .filter((l) => l.label && l.url)
    .map((l) => `${l.label}: ${l.url}`)
    .join('  |  ')
}

const DEFAULT_SECTION_ORDER = [
  'credentials',
  'skillsLanguages',
  'experience',
  'projects',
  'education',
  'hobbiesInterests',
  'honorsAwards',
] as const

function resolvedSectionOrder(cv: CvData): string[] {
  if (Array.isArray(cv.sectionOrder) && cv.sectionOrder.length > 0) {
    return cv.sectionOrder
  }
  return [...DEFAULT_SECTION_ORDER]
}

function renderBasics(doc: PDFKit.PDFDocument, cv: CvData) {
  const { basics, links } = cv

  doc
    .font(FONT_BOLD)
    .fontSize(22)
    .fillColor('#0f172a')
    .text(basics.name, { align: 'center' })
  doc.moveDown(0.2)

  if (basics.headline) {
    doc
      .font(FONT_NAME)
      .fontSize(12)
      .fillColor('#475569')
      .text(basics.headline, { align: 'center' })
    doc.moveDown(0.3)
  }

  const contactParts: string[] = []
  if (basics.email) contactParts.push(basics.email)
  if (basics.mobile) contactParts.push(basics.mobile)
  if (basics.location) contactParts.push(basics.location)
  if (contactParts.length > 0) {
    doc
      .font(FONT_NAME)
      .fontSize(9)
      .fillColor('#64748b')
      .text(contactParts.join('  ·  '), { align: 'center' })
    doc.moveDown(0.25)
  }

  if (links && links.length > 0) {
    const linkText = links
      .filter((l) => l.label && l.url)
      .map((l) => l.url)
      .join('  ·  ')
    if (linkText) {
      doc
        .font(FONT_NAME)
        .fontSize(9)
        .fillColor('#3b82f6')
        .text(linkText, { align: 'center' })
      doc.moveDown(0.25)
    }
  }

  if (basics.summary) {
    doc.moveDown(0.15)
    doc
      .font(FONT_NAME)
      .fontSize(9.5)
      .fillColor('#334155')
      .text(basics.summary, { lineGap: 2 })
  }
}

function renderSkillsLanguages(doc: PDFKit.PDFDocument, cv: CvData) {
  const hasSkills = cv.skills && cv.skills.length > 0
  const hasLanguages = cv.languages && cv.languages.length > 0
  if (!hasSkills && !hasLanguages) return

  sectionHeader(doc, 'Skills & Languages')
  if (hasSkills) {
    doc
      .font(FONT_BOLD)
      .fontSize(9)
      .fillColor('#475569')
      .text('Skills: ', { continued: true })
    doc
      .font(FONT_NAME)
      .fontSize(9)
      .fillColor('#334155')
      .text(cv.skills!.join(', '))
    doc.moveDown(0.3)
  }
  if (hasLanguages) {
    doc
      .font(FONT_BOLD)
      .fontSize(9)
      .fillColor('#475569')
      .text('Languages: ', { continued: true })
    doc
      .font(FONT_NAME)
      .fontSize(9)
      .fillColor('#334155')
      .text(cv.languages!.join(', '))
  }
}

function renderExperience(doc: PDFKit.PDFDocument, cv: CvData) {
  if (!cv.experience || cv.experience.length === 0) return
  sectionHeader(doc, 'Experience')

  for (const exp of cv.experience) {
    const range = dateRange(exp.start, exp.end)
    const companyHeading = [exp.company, ...(exp.links ? exp.links.map((l) => l.url) : [])].filter(Boolean).join('  ')

    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor('#0f172a')
      .text(companyHeading, { continued: !!range, width: CONTENT_WIDTH })
    if (range) {
      doc
        .font(FONT_NAME)
        .fontSize(9)
        .fillColor('#64748b')
        .text(range, { align: 'right' })
    } else {
      doc.text('')
    }

    const subLine = [exp.role, exp.location].filter(Boolean).join('  ·  ')
    doc
      .font(FONT_NAME)
      .fontSize(9.5)
      .fillColor('#334155')
      .text(subLine)

    if (exp.highlights && exp.highlights.length > 0) {
      doc.moveDown(0.15)
      for (const h of exp.highlights) {
        doc
          .font(FONT_NAME)
          .fontSize(9)
          .fillColor('#475569')
          .text(`• ${h}`, { indent: 8, lineGap: 1 })
      }
    }

    if (exp.skills && exp.skills.length > 0) {
      doc.moveDown(0.1)
      doc
        .font(FONT_NAME)
        .fontSize(8.5)
        .fillColor('#64748b')
        .text(exp.skills.join(', '), { indent: 8 })
    }

    doc.moveDown(0.5)
  }
}

function renderEducation(doc: PDFKit.PDFDocument, cv: CvData) {
  if (!cv.education || cv.education.length === 0) return
  sectionHeader(doc, 'Education')

  for (const edu of cv.education) {
    const range = dateRange(edu.start, edu.end)
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor('#0f172a')
      .text(edu.school, { continued: !!range, width: CONTENT_WIDTH })
    if (range) {
      doc
        .font(FONT_NAME)
        .fontSize(9)
        .fillColor('#64748b')
        .text(range, { align: 'right' })
    } else {
      doc.text('')
    }

    const progLine = [edu.degree, edu.program, edu.field].filter(Boolean).join(' · ')
    if (progLine) {
      doc
        .font(FONT_NAME)
        .fontSize(9.5)
        .fillColor('#334155')
        .text(progLine)
    }
    if (edu.location) {
      doc
        .font(FONT_NAME)
        .fontSize(9)
        .fillColor('#64748b')
        .text(edu.location)
    }
    if (edu.gpa) {
      doc
        .font(FONT_NAME)
        .fontSize(9)
        .fillColor('#64748b')
        .text(`GPA: ${edu.gpa}`)
    }
    if (edu.thesisTitle) {
      doc
        .font(FONT_NAME)
        .fontSize(9)
        .fillColor('#64748b')
        .text(`Thesis: ${edu.thesisTitle}`)
    }
    if (edu.highlights && edu.highlights.length > 0) {
      doc.moveDown(0.15)
      for (const h of edu.highlights) {
        doc
          .font(FONT_NAME)
          .fontSize(9)
          .fillColor('#475569')
          .text(`• ${h}`, { indent: 8, lineGap: 1 })
      }
    }
    doc.moveDown(0.5)
  }
}

function renderCredentials(doc: PDFKit.PDFDocument, cv: CvData) {
  if (!cv.credentials || cv.credentials.length === 0) return
  sectionHeader(doc, 'Credentials')

  for (const c of cv.credentials) {
    const dateParts: string[] = []
    if (c.dateEarned) dateParts.push(`Earned: ${c.dateEarned}`)
    if (c.dateExpires) dateParts.push(`Expires: ${c.dateExpires}`)
    const dateStr = dateParts.join('  ·  ')

    doc
      .font(FONT_BOLD)
      .fontSize(9.5)
      .fillColor('#0f172a')
      .text(`${c.label}`, { continued: !!dateStr, width: CONTENT_WIDTH })
    if (dateStr) {
      doc
        .font(FONT_NAME)
        .fontSize(8.5)
        .fillColor('#64748b')
        .text(dateStr, { align: 'right' })
    } else {
      doc.text('')
    }

    const issuerLine = [c.issuer, c.url].filter(Boolean).join('  ·  ')
    if (issuerLine) {
      doc
        .font(FONT_NAME)
        .fontSize(9)
        .fillColor('#64748b')
        .text(issuerLine)
    }
    doc.moveDown(0.3)
  }
}

function renderProjects(doc: PDFKit.PDFDocument, cv: CvData) {
  if (!cv.projects || cv.projects.length === 0) return
  sectionHeader(doc, 'Projects')

  for (const p of cv.projects) {
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor('#0f172a')
      .text(p.name)
    if (p.description) {
      doc
        .font(FONT_NAME)
        .fontSize(9)
        .fillColor('#334155')
        .text(p.description, { lineGap: 1 })
    }
    if (p.tags && p.tags.length > 0) {
      doc
        .font(FONT_NAME)
        .fontSize(8.5)
        .fillColor('#64748b')
        .text(p.tags.join(', '))
    }
    if (p.links && p.links.length > 0) {
      doc
        .font(FONT_NAME)
        .fontSize(8.5)
        .fillColor('#3b82f6')
        .text(formatLinkLine(p.links))
    }
    doc.moveDown(0.5)
  }
}

function renderHobbiesInterests(doc: PDFKit.PDFDocument, cv: CvData) {
  if (!cv.hobbiesInterests || cv.hobbiesInterests.length === 0) return
  sectionHeader(doc, 'Hobbies & Interests')
  doc
    .font(FONT_NAME)
    .fontSize(9)
    .fillColor('#334155')
    .text(cv.hobbiesInterests.join(', '))
}

function renderAwards(doc: PDFKit.PDFDocument, cv: CvData) {
  if (!cv.awards || cv.awards.length === 0) return
  sectionHeader(doc, 'Honors & Awards')

  for (const a of cv.awards) {
    const meta = [a.issuer, a.year].filter(Boolean).join('  ·  ')
    doc
      .font(FONT_BOLD)
      .fontSize(9.5)
      .fillColor('#0f172a')
      .text(a.title, { continued: !!meta, width: CONTENT_WIDTH })
    if (meta) {
      doc
        .font(FONT_NAME)
        .fontSize(9)
        .fillColor('#64748b')
        .text(meta, { align: 'right' })
    } else {
      doc.text('')
    }
    doc.moveDown(0.25)
  }
}

const SECTION_RENDERERS: Record<string, (doc: PDFKit.PDFDocument, cv: CvData) => void> = {
  credentials: renderCredentials,
  skillsLanguages: renderSkillsLanguages,
  experience: renderExperience,
  projects: renderProjects,
  education: renderEducation,
  hobbiesInterests: renderHobbiesInterests,
  honorsAwards: renderAwards,
}

/**
 * Generates a text-searchable A4 PDF buffer from the given CV data using
 * built-in Helvetica fonts (no external font files needed).
 */
export function buildCvPdfBuffer(cv: CvData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
      info: {
        Title: cv.basics.name ?? 'CV',
        Author: cv.basics.name ?? '',
        Subject: 'Curriculum Vitae',
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    renderBasics(doc, cv)

    for (const key of resolvedSectionOrder(cv)) {
      const renderer = SECTION_RENDERERS[key]
      if (renderer) renderer(doc, cv)
    }

    doc.end()
  })
}
