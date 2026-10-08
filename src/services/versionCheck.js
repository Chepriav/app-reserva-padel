// Detects new deploys by polling /version.json (written at build time).
// Works even when the service worker has not changed.

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

let loadedVersion = null;

async function fetchVersion() {
  try {
    // Timestamp avoids any HTTP or old service-worker cache
    const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data?.version === 'string' ? data.version : null;
  } catch {
    return null;
  }
}

/**
 * Starts watching for a newer deployed version.
 * Calls onNewVersion once when the deployed version differs from the loaded one.
 * Returns a cleanup function.
 */
export function startVersionCheck(onNewVersion) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  let notified = false;

  const check = async () => {
    if (notified) return;
    const deployed = await fetchVersion();
    if (!deployed) return;

    if (loadedVersion === null) {
      loadedVersion = deployed;
      return;
    }

    if (deployed !== loadedVersion) {
      notified = true;
      onNewVersion();
    }
  };

  const onVisible = () => {
    if (document.visibilityState === 'visible') check();
  };

  check();
  const interval = setInterval(check, CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
