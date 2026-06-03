<<<<<<< HEAD
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
})

const THEME_KEY = 'maskan-theme'

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY)
    const nextIsDark = stored === 'dark'
    setIsDark(nextIsDark)
    document.documentElement.dataset.theme = nextIsDark ? 'dark' : 'light'
  }, [])

  const toggleTheme = () => {
    setIsDark((prev) => {
      const nextValue = prev ? 'light' : 'dark'
      localStorage.setItem(THEME_KEY, nextValue)
      document.documentElement.dataset.theme = nextValue
      return nextValue === 'dark'
    })
  }

  const value = useMemo(() => ({ isDark, toggleTheme }), [isDark])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
=======
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

const THEME_STORAGE_KEY = 'theme'
const VALID_THEMES = ['light', 'dark']

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved && VALID_THEMES.includes(saved)) {
      return saved
    }
  } catch {
    // Ignore storage errors and use fallback theme.
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getInitialTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore storage errors in restricted contexts.
    }
  }, [theme])

  const setTheme = useCallback((nextTheme) => {
    if (!VALID_THEMES.includes(nextTheme)) {
      return
    }
    setThemeState(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  }), [theme, setTheme, toggleTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }
  return context
>>>>>>> parent of 8e1c170 (remove dark mode)
}
