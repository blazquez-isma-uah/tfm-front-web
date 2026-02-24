import { useState, useEffect } from 'react'

/**
 * Devuelve true mientras la media query proporcionada coincide con el viewport actual.
 *
 * Se suscribe al cambio de ventana mediante MediaQueryList.addEventListener,
 * lo que es más eficiente que el listener global 'resize' porque el navegador
 * solo dispara el evento cuando el estado de la query cambia (no en cada pixel).
 *
 * @example
 *   const isMobile = useMediaQuery('(max-width: 479px)')
 */
export function useMediaQuery(query: string): boolean {
  // Inicializamos con el valor actual para evitar un parpadeo en el primer render.
  // window.matchMedia puede no existir en entornos SSR; el fallback a false es seguro.
  const [matches, setMatches] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQueryList = window.matchMedia(query)
    setMatches(mediaQueryList.matches)

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)

    // addEventListener es el API moderno (addListener está deprecated desde 2020)
    mediaQueryList.addEventListener('change', handler)
    return () => mediaQueryList.removeEventListener('change', handler)
  }, [query]) // Re-ejecutar solo si la query cambia (en la práctica, nunca)

  return matches
}