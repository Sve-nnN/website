'use client'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '@/theme/theme'

// El tema se importa solo desde este archivo cliente. No lo pases como prop
// desde un server component: createTheme devuelve funciones y no serializa.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="dark">
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  )
}
