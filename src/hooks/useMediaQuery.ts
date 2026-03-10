import { useState, useEffect } from 'react'

/**
 * useMediaQuery — Devuelve true mientras la media query coincide con el viewport.
 * 
 * Se suscribe mediante MediaQueryList.addEventListener, más eficiente que
 * un listener global 'resize' porque solo dispara cuando el estado de la query cambia.
 * 
 * @example const isMobile = useMediaQuery('(max-width: 479px)')
 */
export function useMediaQuery(query: string): boolean {
  // Inicializamos con el valor actual para evitar un parpadeo en el primer render.
  // window.matchMedia puede no existir en SSR; el fallback a false es seguro.
  const [matches, setMatches] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQueryList = window.matchMedia(query)
    // Sincronizamos el estado con el valor actual de la query
    setMatches(mediaQueryList.matches)

    // Handler que se ejecuta cuando el estado de la media query cambia
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)

    // addEventListener es el API moderno (addListener está deprecated)
    mediaQueryList.addEventListener('change', handler)
    return () => mediaQueryList.removeEventListener('change', handler)
  }, [query])

  return matches
}