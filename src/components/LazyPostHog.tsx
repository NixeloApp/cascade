/**
 * Lazy PostHog
 *
 * Deferred PostHog analytics provider for improved page load.
 * Loads PostHog SDK lazily after initial render (~150KB saved).
 * Wraps children once analytics are ready.
 */

import type { PostHogProvider as PostHogProviderType } from "posthog-js/react";
import { type ReactNode, useEffect, useState } from "react";

interface LazyPostHogProps {
  apiKey: string;
  options: { api_host: string };
  children: ReactNode;
}

/**
 * Lazy-loaded PostHog provider that defers analytics loading
 * to improve initial page load performance (~150 KB deferred).
 *
 * PostHog is loaded 2 seconds after the initial render or on user interaction,
 * whichever comes first.
 */
export function LazyPostHog({ apiKey, options, children }: LazyPostHogProps) {
  const [PostHogProvider, setPostHogProvider] = useState<typeof PostHogProviderType | null>(null);

  useEffect(() => {
    if (!apiKey) {
      // If no API key, don't load PostHog
      return;
    }

    let mounted = true;

    // Load PostHog after 2 seconds or on first user interaction
    const loadPostHog = async () => {
      if (!mounted) return;

      try {
        const { PostHogProvider: Provider } = await import("posthog-js/react");
        // Re-check mounted after async import completes (component may have unmounted)
        if (mounted) {
          setPostHogProvider(() => Provider);
        }
      } catch (error) {
        console.warn("[analytics] Failed to lazy-load PostHog provider", { error });
      }
    };

    // Timer to load after 2 seconds
    const timer = setTimeout(loadPostHog, 2000);

    // Load on first user interaction
    const interactionEvents = ["mousedown", "keydown", "touchstart", "scroll"];
    const handleInteraction = () => {
      clearTimeout(timer);
      loadPostHog();
      // Remove listeners after first interaction
      interactionEvents.forEach((event) => {
        window.removeEventListener(event, handleInteraction);
      });
    };

    interactionEvents.forEach((event) => {
      window.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      interactionEvents.forEach((event) => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, [apiKey]);

  // If PostHog hasn't loaded yet, render children without analytics
  if (!PostHogProvider) {
    return <>{children}</>;
  }

  // Once loaded, wrap with PostHogProvider
  return (
    <PostHogProvider apiKey={apiKey} options={options}>
      {children}
    </PostHogProvider>
  );
}
