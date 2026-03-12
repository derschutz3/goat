import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  // Ler do localStorage ou usar preferência do sistema, padrão 'dark'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('primatas_theme')
    if (saved) return saved
    return 'dark' // Default dark
  })

  useEffect(() => {
    localStorage.setItem('primatas_theme', theme)
    
    // Aplicar classe no body
    if (theme === 'light') {
      document.body.classList.add('light-mode')
    } else {
      document.body.classList.remove('light-mode')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}