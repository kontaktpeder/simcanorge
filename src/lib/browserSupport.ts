export type BrowserAuthSupport = {
  ok: boolean;
  reasons: string[];
};

function canUseLocalStorage(): boolean {
  try {
    const key = "__simca_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getBrowserAuthSupport(): BrowserAuthSupport {
  const reasons: string[] = [];

  // Supabase-js relies on WebCrypto in modern browsers
  const hasWebCrypto = typeof window !== "undefined" && !!window.crypto && !!window.crypto.subtle;
  if (!hasWebCrypto) reasons.push("Nettleseren støtter ikke moderne sikkerhetsfunksjoner (WebCrypto).");

  // Auth sessions are persisted in storage
  if (!canUseLocalStorage()) reasons.push("Lagring i nettleser (localStorage) er blokkert eller deaktivert.");

  // Cookies are commonly required depending on environment
  if (typeof navigator !== "undefined" && navigator.cookieEnabled === false) {
    reasons.push("Informasjonskapsler (cookies) er deaktivert.");
  }

  // Some environments (old browsers / hardened settings) might not be secure contexts
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    reasons.push("Siden kjøres ikke i en sikker kontekst (HTTPS/secure context).");
  }

  return { ok: reasons.length === 0, reasons };
}
