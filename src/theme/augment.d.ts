import '@mui/material/styles';

type Band = { bg: string; surface: string; text: string; muted: string; border: string };

declare module '@mui/material/styles' {
  interface Palette { accentText: string; raised: string; fieldBorder: string; band: Band }
  interface PaletteOptions { accentText?: string; raised?: string; fieldBorder?: string; band?: Band }
  interface TypographyVariants { mono: React.CSSProperties }
  interface TypographyVariantsOptions { mono?: React.CSSProperties }
}
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides { mono: true }
}
