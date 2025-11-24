import { useState, useEffect } from 'react'

// Tracks whether the viewport is within the mobile breakpoint to toggle layouts/components.
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return isMobile
}
