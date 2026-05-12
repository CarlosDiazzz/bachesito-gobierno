import React, { createContext, useContext, useState, useEffect } from 'react'

const UIContext = createContext()

export function UIProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => {
    if (window.innerWidth <= 1024) setSidebarOpen(false)
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <UIContext.Provider value={{ sidebarOpen, toggleSidebar, closeSidebar }}>
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => useContext(UIContext)
