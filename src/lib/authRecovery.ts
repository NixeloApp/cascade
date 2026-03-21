const AUTHENTICATED_SESSION_MARKER_STORAGE_KEY = "nixelo-authenticated-session";

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Detects whether any persisted Convex auth tokens are currently available in local storage.
 */
export function hasStoredConvexAuthSession(): boolean {
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) {
        continue;
      }

      const isConvexAuthKey =
        key === "convexAuthToken" ||
        key === "convexAuthRefreshToken" ||
        key === "__convexAuthJWT" ||
        key === "__convexAuthRefreshToken" ||
        key.startsWith("__convexAuthJWT_") ||
        key.startsWith("__convexAuthRefreshToken_");

      if (isConvexAuthKey && storage.getItem(key)) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Marks the current browser session as having reached an authenticated app state.
 */
export function markAuthenticatedSession(): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(AUTHENTICATED_SESSION_MARKER_STORAGE_KEY, String(Date.now()));
  } catch {
    // Non-critical best-effort cache.
  }
}

/**
 * Removes the best-effort authenticated-session marker from local storage.
 */
export function clearAuthenticatedSessionMarker(): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(AUTHENTICATED_SESSION_MARKER_STORAGE_KEY);
  } catch {
    // Non-critical best-effort cache.
  }
}

/**
 * Indicates whether the client has enough persisted auth state to attempt offline route recovery.
 */
export function hasRecoverableAuthenticatedSession(): boolean {
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }

  try {
    return (
      storage.getItem(AUTHENTICATED_SESSION_MARKER_STORAGE_KEY) !== null ||
      hasStoredConvexAuthSession()
    );
  } catch {
    return hasStoredConvexAuthSession();
  }
}

/**
 * Reads a JSON payload from local storage and returns `undefined` on missing or invalid data.
 */
export function readLocalStorageJson<T>(key: string): T | undefined {
  const storage = getLocalStorage();
  if (!storage) {
    return undefined;
  }

  try {
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as T) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Writes a JSON-serializable payload to local storage on a best-effort basis.
 */
export function writeLocalStorageJson<T>(key: string, value: T): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Non-critical best-effort cache.
  }
}

/**
 * Removes a specific local-storage entry on a best-effort basis.
 */
export function removeLocalStorageValue(key: string): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // Non-critical best-effort cache.
  }
}
