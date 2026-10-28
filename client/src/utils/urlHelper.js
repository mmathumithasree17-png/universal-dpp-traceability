const PUBLIC_PRODUCTION_ORIGIN = 'https://universal-dpp-traceability.onrender.com';

/**
 * Resolves a QR code target URL so that phones scanning the QR code
 * ALWAYS receive a reachable public HTTPS URL when deployed on the internet,
 * or the live production HTTPS URL when viewing locally.
 */
export function resolveReachableUrl(targetUrl, fallbackPath = '/dashboard') {
  if (typeof window === 'undefined') return targetUrl || fallbackPath;

  const currentOrigin = window.location.origin;
  const isPublicHost =
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  // Use currentOrigin if deployed publicly; otherwise use the live cloud deployment on Render
  // so that mobile phones scanning the QR code from the user's laptop screen ALWAYS connect!
  const effectiveBaseUrl = isPublicHost ? currentOrigin : PUBLIC_PRODUCTION_ORIGIN;

  if (!targetUrl) {
    const cleanPath = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`;
    return `${effectiveBaseUrl}${cleanPath}`;
  }

  // If targetUrl points to localhost, LAN IP, internal docker IP, or placeholder domain
  if (
    targetUrl.includes('dpp.aerodrive.com') ||
    targetUrl.includes('localhost') ||
    targetUrl.includes('127.0.0.1') ||
    targetUrl.match(/http:\/\/(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1]))/)
  ) {
    try {
      const parsed = new URL(targetUrl);
      return `${effectiveBaseUrl}${parsed.pathname}${parsed.search}`;
    } catch (e) {
      const cleanPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
      return `${effectiveBaseUrl}${cleanPath}`;
    }
  }

  if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
    return targetUrl;
  }

  const cleanPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
  return `${effectiveBaseUrl}${cleanPath}`;
}

/**
 * Directly generates a phone-scannable URL pointing to the product's full traceability tree.
 */
export function resolveTraceabilityUrl(identifier, direction = 'backward') {
  const cleanId = (identifier || 'DPP-EV500-2026-003').trim();
  return resolveReachableUrl('', `/traceability?id=${encodeURIComponent(cleanId)}&dir=${direction}`);
}

