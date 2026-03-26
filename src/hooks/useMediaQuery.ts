import { useEffect, useState } from "react";

/** Subscribe to a browser media query with an SSR-safe fallback value. */
export function useMediaQuery(query: string, defaultValue = false) {
  const getMatches = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return defaultValue;
    }

    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQueryList.matches);

    updateMatches();

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", updateMatches);
      return () => mediaQueryList.removeEventListener("change", updateMatches);
    }

    mediaQueryList.addListener(updateMatches);
    return () => mediaQueryList.removeListener(updateMatches);
  }, [query]);

  return matches;
}
