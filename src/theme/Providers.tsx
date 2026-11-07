'use client'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '@/theme/theme'
import { MotionStateProvider } from './motion'

// El tema se importa solo desde este archivo cliente. No lo pases como prop
// desde un server component: createTheme devuelve funciones y no serializa.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="dark">
      {/* Orden de capas: idempotente con el plugin PostCSS. El primero de los
          dos que aparezca en el documento fija `tailwind` por debajo de `mui`. */}
      <GlobalStyles styles="@layer tailwind, mui;" />
      {/* Movimiento (D-16). Las variables alimentan las transiciones del tema y
          en pausa valen 0ms. `!important` es intencional: tiene que ganar a las
          capas y a los estilos en linea de MUI. */}
      <GlobalStyles
        styles={{
          ':root': {
            '--jt-motion-fast': '200ms',
            '--jt-motion-base': '300ms',
            '--jt-motion-slow': '500ms',
          },
          "html[data-motion='paused']": {
            '--jt-motion-fast': '0ms',
            '--jt-motion-base': '0ms',
            '--jt-motion-slow': '0ms',
            scrollBehavior: 'auto !important',
          },
          "html[data-motion='paused'] *, html[data-motion='paused'] *::before, html[data-motion='paused'] *::after": {
            animationPlayState: 'paused !important',
          },
          "html[data-motion='paused'] .MuiButton-root:hover": {
            transform: 'none !important',
          },
        }}
      />
      <CssBaseline enableColorScheme />
      <MotionStateProvider>{children}</MotionStateProvider>
    </ThemeProvider>
  )
}
