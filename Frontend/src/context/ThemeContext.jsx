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
}
