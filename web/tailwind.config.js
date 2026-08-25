/** @type {import('tailwindcss').Config} */

/**
 * Semantic tokens are the only colours components should reach for. Each one resolves to a CSS
 * variable defined in `index.css`, so light and dark are one swap of that variable block rather
 * than a `dark:` twin on every utility.
 *
 * Variables hold space-separated RGB channels so Tailwind's `<alpha-value>` still works
 * (`bg-surface/70`, `border-line/60`, ...).
 */
const token = (name) => `rgb(var(--vc-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /** Page background behind every surface. */
        canvas: token('canvas'),
        /** Cards, sheets, popovers — anything that sits on the canvas. */
        surface: {
          DEFAULT: token('surface'),
          muted: token('surface-muted'),
          sunken: token('surface-sunken'),
        },
        /** Borders and dividers. `strong` is for focusable/hovered edges. */
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        /** Text. `muted` for secondary copy, `subtle` for meta/labels. */
        ink: {
          DEFAULT: token('ink'),
          muted: token('ink-muted'),
          subtle: token('ink-subtle'),
          inverted: token('ink-inverted'),
        },
        accent: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          soft: token('accent-soft'),
          'soft-ink': token('accent-soft-ink'),
          ink: token('accent-ink'),
        },
        positive: {
          DEFAULT: token('positive'),
          soft: token('positive-soft'),
          'soft-ink': token('positive-soft-ink'),
        },
        caution: {
          DEFAULT: token('caution'),
          soft: token('caution-soft'),
          'soft-ink': token('caution-soft-ink'),
        },
        critical: {
          DEFAULT: token('critical'),
          soft: token('critical-soft'),
          'soft-ink': token('critical-soft-ink'),
        },
      },
      borderRadius: {
        card: '0.875rem',
        field: '0.625rem',
      },
      boxShadow: {
        // A tight contact shadow plus a wide soft one — reads as elevation without the heavy
        // drop shadow the previous cards used.
        card: '0 1px 2px rgb(var(--vc-shadow) / 0.05), 0 1px 3px -1px rgb(var(--vc-shadow) / 0.06)',
        raised: '0 2px 4px -2px rgb(var(--vc-shadow) / 0.08), 0 8px 20px -8px rgb(var(--vc-shadow) / 0.16)',
        overlay: '0 8px 16px -8px rgb(var(--vc-shadow) / 0.14), 0 24px 48px -24px rgb(var(--vc-shadow) / 0.30)',
        none: 'none',
      },
      fontFamily: {
        sans: [
          'Inter var',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      fontSize: {
        // Tuned line-heights and tracking for a denser, more editorial CV feel.
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.8125rem', { lineHeight: '1.375rem' }],
        base: ['0.9375rem', { lineHeight: '1.625rem' }],
        lg: ['1.0625rem', { lineHeight: '1.625rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.018em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.022em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.026em' }],
      },
      transitionTimingFunction: {
        emphasis: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      keyframes: {
        // Sweep used by the CV loading skeleton: reads as content streaming in, where a pulse
        // only reads as "something is blinking".
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // Softens the hand-off when a skeleton is replaced by the real content.
        //
        // Opacity only, deliberately: a `transform` here would make the animated wrapper a
        // containing block for `position: fixed` descendants for as long as the animation is
        // live, which is what pulled the CV top bar out of the viewport and into the content
        // column. The 4px rise it replaces was not worth that.
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-0.5rem)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        'fade-in': 'fade-in 240ms ease-out both',
        'slide-down': 'slide-down 220ms cubic-bezier(0.2, 0, 0, 1) both',
      },
    },
  },
  plugins: [],
}
