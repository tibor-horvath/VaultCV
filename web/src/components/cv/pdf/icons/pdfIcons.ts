import {
  siAppstore,
  siGithub,
  siGitlab,
  siGoogle,
  siGoogleplay,
  siMastodon,
  siNpm,
  siPypi,
  siX,
  siYoutube,
} from 'simple-icons'
import { SI_LINKEDIN_PATH } from '../../../icons/SimpleBrandIcons'

/**
 * Icon geometry for the PDF renderer. react-pdf's `<Svg>` cannot render React DOM components,
 * so both icon families are reduced to raw primitives here.
 *
 * `simple-icons` exposes `.path` as public API, so those are imported directly.
 *
 * Lucide geometry is **vendored**: `lucide-react` does not re-export `__iconNode` from its
 * barrel, so the only programmatic access is a deep import into `dist/esm/icons/*.js` — private,
 * unversioned API that would break silently on an upstream restructure. Copying the data mirrors
 * what this repo already does for the LinkedIn mark.
 *
 * Vendored from lucide-react v0.577.0. To refresh an icon:
 *   cat node_modules/lucide-react/dist/esm/icons/<name>.js
 * and copy its `__iconNode` array. `pdfIcons.test.ts` guards the shape.
 */

export type PdfIconNode =
  | { tag: 'path'; d: string }
  | { tag: 'circle'; cx: string; cy: string; r: string }
  | { tag: 'rect'; x: string; y: string; width: string; height: string; rx?: string }

export type PdfIconDef =
  /** Lucide: multiple stroked nodes, no fill. */
  | { kind: 'stroke'; nodes: PdfIconNode[] }
  /** Simple Icons: one filled path. */
  | { kind: 'fill'; d: string }
  /** Multi-shape filled marks (Microsoft tiles, AWS wordmark) with optional per-node opacity. */
  | { kind: 'fillNodes'; nodes: Array<PdfIconNode & { opacity?: number }> }

export const pdfIcons = {
  atSign: {
    kind: 'stroke',
    nodes: [
      { tag: 'circle', cx: '12', cy: '12', r: '4' },
      { tag: 'path', d: 'M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8' },
    ],
  },
  bookOpenText: {
    kind: 'stroke',
    nodes: [
      { tag: 'path', d: 'M12 7v14' },
      { tag: 'path', d: 'M16 12h2' },
      { tag: 'path', d: 'M16 8h2' },
      {
        tag: 'path',
        d: 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
      },
      { tag: 'path', d: 'M6 12h2' },
      { tag: 'path', d: 'M6 8h2' },
    ],
  },
  calendar: {
    kind: 'stroke',
    nodes: [
      { tag: 'path', d: 'M8 2v4' },
      { tag: 'path', d: 'M16 2v4' },
      { tag: 'rect', width: '18', height: '18', x: '3', y: '4', rx: '2' },
      { tag: 'path', d: 'M3 10h18' },
    ],
  },
  flaskConical: {
    kind: 'stroke',
    nodes: [
      {
        tag: 'path',
        d: 'M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2',
      },
      { tag: 'path', d: 'M6.453 15h11.094' },
      { tag: 'path', d: 'M8.5 2h7' },
    ],
  },
  globe: {
    kind: 'stroke',
    nodes: [
      { tag: 'circle', cx: '12', cy: '12', r: '10' },
      { tag: 'path', d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' },
      { tag: 'path', d: 'M2 12h20' },
    ],
  },
  mail: {
    kind: 'stroke',
    nodes: [
      { tag: 'path', d: 'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7' },
      { tag: 'rect', x: '2', y: '4', width: '20', height: '16', rx: '2' },
    ],
  },
  mapPin: {
    kind: 'stroke',
    nodes: [
      {
        tag: 'path',
        d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0',
      },
      { tag: 'circle', cx: '12', cy: '10', r: '3' },
    ],
  },
  scanSearch: {
    kind: 'stroke',
    nodes: [
      { tag: 'path', d: 'M3 7V5a2 2 0 0 1 2-2h2' },
      { tag: 'path', d: 'M17 3h2a2 2 0 0 1 2 2v2' },
      { tag: 'path', d: 'M21 17v2a2 2 0 0 1-2 2h-2' },
      { tag: 'path', d: 'M7 21H5a2 2 0 0 1-2-2v-2' },
      { tag: 'circle', cx: '12', cy: '12', r: '3' },
      { tag: 'path', d: 'm16 16-1.9-1.9' },
    ],
  },
  sparkles: {
    kind: 'stroke',
    nodes: [
      {
        tag: 'path',
        d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
      },
      { tag: 'path', d: 'M20 2v4' },
      { tag: 'path', d: 'M22 4h-4' },
      { tag: 'circle', cx: '4', cy: '20', r: '2' },
    ],
  },
  graduationCap: {
    kind: 'stroke',
    nodes: [
      {
        tag: 'path',
        d: 'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z',
      },
      { tag: 'path', d: 'M22 10v6' },
      { tag: 'path', d: 'M6 12.5V16a6 3 0 0 0 12 0v-3.5' },
    ],
  },
  languages: {
    kind: 'stroke',
    nodes: [
      { tag: 'path', d: 'm5 8 6 6' },
      { tag: 'path', d: 'm4 14 6-6 2-3' },
      { tag: 'path', d: 'M2 5h12' },
      { tag: 'path', d: 'M7 2h1' },
      { tag: 'path', d: 'm22 22-5-10-5 10' },
      { tag: 'path', d: 'M14 18h6' },
    ],
  },
  shieldCheck: {
    kind: 'stroke',
    nodes: [
      {
        tag: 'path',
        d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
      },
      { tag: 'path', d: 'm9 12 2 2 4-4' },
    ],
  },

  github: { kind: 'fill', d: siGithub.path },
  gitlab: { kind: 'fill', d: siGitlab.path },
  google: { kind: 'fill', d: siGoogle.path },
  googleplay: { kind: 'fill', d: siGoogleplay.path },
  appstore: { kind: 'fill', d: siAppstore.path },
  mastodon: { kind: 'fill', d: siMastodon.path },
  npm: { kind: 'fill', d: siNpm.path },
  pypi: { kind: 'fill', d: siPypi.path },
  x: { kind: 'fill', d: siX.path },
  youtube: { kind: 'fill', d: siYoutube.path },
  linkedin: { kind: 'fill', d: SI_LINKEDIN_PATH },

  microsoft: {
    kind: 'fillNodes',
    nodes: [
      { tag: 'rect', x: '3', y: '3', width: '8', height: '8', rx: '1.5' },
      { tag: 'rect', x: '13', y: '3', width: '8', height: '8', rx: '1.5', opacity: 0.9 },
      { tag: 'rect', x: '3', y: '13', width: '8', height: '8', rx: '1.5', opacity: 0.85 },
      { tag: 'rect', x: '13', y: '13', width: '8', height: '8', rx: '1.5', opacity: 0.8 },
    ],
  },
  aws: {
    kind: 'fillNodes',
    nodes: [
      {
        tag: 'path',
        d: 'M4.25 16.6c2.4 1.76 5.2 2.65 8.05 2.65 3.2 0 6.2-1.1 8.45-2.98.26-.2.03-.62-.29-.45-2.44 1.27-5.3 1.95-8.15 1.95-2.6 0-5.2-.64-7.57-1.87-.34-.18-.66.24-.49.7ZM19.16 15.64c-.33-.44-2.17-.2-3 .07-.25.08-.29-.19-.06-.35 1.47-1.03 3.89-.73 4.17-.38.27.35-.07 2.77-1.44 3.91-.21.17-.41.08-.32-.15.29-.76.92-2.44.65-3.1Z',
      },
      {
        tag: 'path',
        d: 'M7.34 9.58c.14-.19.38-.31.63-.31h2.03c.24 0 .44.12.53.33l3.16 7.53c.07.18.02.38-.12.51l-1.03.96c-.15.14-.38.14-.53.02l-.83-.73a.383.383 0 0 1-.12-.18l-.65-1.58H7.74l-.6 1.45c-.06.16-.22.26-.39.26H5.3c-.31 0-.51-.33-.38-.62L7.34 9.58Zm1.02 2.17-.9 2.17h1.84l-.94-2.17Z',
        opacity: 0.9,
      },
    ],
  },
} satisfies Record<string, PdfIconDef>

export type PdfIconName = keyof typeof pdfIcons
