export type OAuthProvider = 'google' | 'apple';
export type OAuthMode = 'login' | 'signup';

const apiBase = import.meta.env.VITE_API_URL || '/api/v1';

/** Redirect browser to backend OAuth initiation (Google / Apple). */
export function startOAuth(provider: OAuthProvider, mode: OAuthMode = 'login') {
  const params = new URLSearchParams({ mode });
  window.location.assign(`${apiBase}/auth/oauth/${provider}?${params}`);
}
