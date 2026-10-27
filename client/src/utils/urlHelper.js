/**
 * Resolves a QR code target URL so that phones scanning the QR code
 * ALWAYS receive a reachable public HTTPS URL when deployed on the internet,
 * or the correct LAN IP when testing on local Wi-Fi.
 */
export function resolveReachableUrl(targetUrl, fallbackPath = '/dashboard') {
  if (typeof window === 'undefined') return targetUrl || fallbackPath;

  const currentOrigin = window.location.origin;
  const isPublicHost = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  // If on public internet (e.g. Render / custom domain)
  if (isPublicHost) {
    if (!targetUrl) {
      const cleanPath = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`;
      return `${currentOrigin}${cleanPath}`;
    }

    // If targetUrl points to a private LAN IP, internal docker IP, or localhost
    if (
      targetUrl.includes('dpp.aerodrive.com') ||
      targetUrl.includes('localhost') ||
      targetUrl.includes('127.0.0.1') ||
      targetUrl.match(/http:\/\/(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1]))/)
    ) {
      try {
        const parsed = new URL(targetUrl);
        return `${currentOrigin}${parsed.pathname}${parsed.search}`;
      } catch (e) {
        const cleanPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
        return `${currentOrigin}${cleanPath}`;
      }
    }

    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      return targetUrl;
    }

    const cleanPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
    return `${currentOrigin}${cleanPath}`;
  }

  // If on local development (localhost)
  if (
    targetUrl &&
    (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) &&
    !targetUrl.includes('dpp.aerodrive.com')
  ) {
    return targetUrl;
  }

  const lanIp = '10.1.0.173';
  const port = window.location.port || '5001';
  const path = targetUrl && targetUrl.startsWith('/') ? targetUrl : fallbackPath;
  return `http://${lanIp}:${port}${path}`;
}
