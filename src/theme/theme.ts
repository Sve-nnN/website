'use client';
import { createTheme, type ThemeOptions } from '@mui/material/styles';
import { font, motion, radius, dark, type SchemeTokens } from './tokens';

const scheme = (t: SchemeTokens, isDark: boolean) => ({
  palette: {
    primary: { main: t.accent, contrastText: t.onAccent },
    secondary: { main: isDark ? '#FAFAF7' : '#12141C', contrastText: isDark ? '#12141C' : '#FAFAF7' },
    success: { main: t.good, contrastText: isDark ? '#12141C' : '#FFFFFF' },
    warning: { main: t.mid, contrastText: isDark ? '#12141C' : '#FFFFFF' },
    error: { main: t.poor, contrastText: isDark ? '#12141C' : '#FFFFFF' },
    background: { default: t.bg, paper: t.surface },
    text: { primary: t.text, secondary: t.muted },
    divider: t.border,
    accentText: t.accentText, raised: t.raised, fieldBorder: t.fieldBorder, band: t.band,
  },
});

const reduced = '@media (prefers-reduced-motion: reduce)';

const options: ThemeOptions = {
  cssVariables: { colorSchemeSelector: 'data', cssVarPrefix: 'jt' },
  // Sitio solo oscuro por decision de Juan. Los tokens claros se conservan en tokens.ts como referencia.
  defaultColorScheme: 'dark',
  colorSchemes: { dark: scheme(dark, true) },
  shape: { borderRadius: radius.sm },
  typography: {
    fontFamily: font.sans,
    h1: { fontSize: 'clamp(2.5rem, 6vw, 3.75rem)', lineHeight: 1, fontWeight: 600, letterSpacing: '-0.02em', textWrap: 'balance' },
    h2: { fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.02em', textWrap: 'balance' },
    h3: { fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: 600, textWrap: 'balance' },
    h4: { fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: 600 },
    h5: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 600 },
    h6: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 600 },
    subtitle1: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 600 },
    body1: { fontSize: '1rem', lineHeight: '1.5rem' },
    body2: { fontSize: '0.875rem', lineHeight: '1.25rem' },
    caption: { fontSize: '0.75rem', lineHeight: '1rem' },
    overline: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 600, letterSpacing: '0.08em' },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '1rem', lineHeight: '1.5rem' },
    mono: { fontFamily: font.mono, fontWeight: 500, fontSize: '0.875rem', lineHeight: '1.25rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        html: { scrollBehavior: 'smooth', scrollPaddingTop: 96, scrollPaddingBottom: 72, [reduced]: { scrollBehavior: 'auto' } },
        body: { WebkitFontSmoothing: 'antialiased', textWrap: 'pretty', overflowX: 'hidden' },
        ':focus-visible': { outline: `2px solid ${theme.vars.palette.accentText}`, outlineOffset: 2, borderRadius: 4 },
        'ul, ol': { listStyle: 'none', margin: 0, padding: 0 },
      }),
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: radius.sm, minHeight: 44, padding: '8px 16px',
          transition: `transform var(--jt-motion-base, ${motion.base}ms) ${motion.ease}, background-color var(--jt-motion-base, ${motion.base}ms) ${motion.ease}`,
          '&:hover': { transform: 'translateY(-2px)', [reduced]: { transform: 'none' } },
          '&:active': { transform: 'scale(0.98)' },
          variants: [
            // El naranja de marca da 3.17:1 como texto sobre el fondo claro. El texto usa accentText (5.15:1).
            { props: { variant: 'text', color: 'primary' }, style: { color: theme.vars.palette.accentText } },
          ],
        }),
        sizeSmall: { minHeight: 40, padding: '4px 12px', fontSize: '0.875rem', lineHeight: '1.25rem' },
        sizeLarge: { minHeight: 52, padding: '12px 24px' },
        outlined: ({ theme }) => ({ borderColor: theme.vars.palette.text.primary, color: theme.vars.palette.text.primary,
          '&:hover': { borderColor: theme.vars.palette.text.primary, backgroundColor: theme.vars.palette.raised } }),
      },
    },
    MuiIconButton: { styleOverrides: { root: { width: 44, height: 44 } } },
    MuiLink: { defaultProps: { underline: 'always' }, styleOverrides: { root: ({ theme }) => ({ color: theme.vars.palette.accentText, textUnderlineOffset: 3 }) } },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: ({ theme }) => ({ borderRadius: radius.md, borderColor: theme.vars.palette.divider, backgroundImage: 'none' }) },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({ fontFamily: font.mono, fontWeight: 500, fontSize: '0.75rem', backgroundColor: theme.vars.palette.raised, color: theme.vars.palette.text.primary, border: `1px solid ${theme.vars.palette.divider}` }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: radius.sm, backgroundColor: theme.vars.palette.background.default,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.vars.palette.fieldBorder },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.vars.palette.text.primary },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.vars.palette.accentText, borderWidth: 2 },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: theme.vars.palette.error.main },
        }),
        input: { padding: '12px 14px' },
      },
    },
    MuiInputLabel: { styleOverrides: { root: ({ theme }) => ({ color: theme.vars.palette.text.secondary, '&.Mui-focused': { color: theme.vars.palette.accentText } }) } },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0, square: false },
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.vars.palette.divider}`, borderRadius: radius.md, backgroundImage: 'none',
          '&:before': { display: 'none' }, '&.Mui-expanded': { borderColor: theme.vars.palette.text.primary, margin: 0 },
          '&:first-of-type, &:last-of-type': { borderRadius: radius.md },
        }),
      },
    },
    MuiAccordionSummary: { styleOverrides: { root: { minHeight: 56, padding: '0 16px' }, content: { fontWeight: 600 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: radius.sm } } },
    MuiTooltip: { defaultProps: { arrow: true }, styleOverrides: { tooltip: { fontSize: '0.875rem', lineHeight: '1.25rem', padding: '6px 10px' } } },
  },
};

export const theme = createTheme(options);
