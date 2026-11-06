'use client'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '@/theme/theme'

// El tema se importa solo desde este archivo cliente. No lo pases como prop
// desde un server component: createTheme devuelve funciones y no serializa.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="dark">
      {/* Orden de capas: idempotente con el plugin PostCSS. El primero de los
          dos que aparezca en el documento fija `tailwind` por debajo de `mui`. */}
      <GlobalStyles styles="@layer tailwind, mui;" />
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  )
}
