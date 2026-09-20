export function safeAuthReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20\x7f]/.test(value)) return '/app';
  try {
    const url = new URL(value, 'https://certscore.ai');
    return url.origin === 'https://certscore.ai' ? `${url.pathname}${url.search}${url.hash}` : '/app';
  } catch { return '/app'; }
}
export function authRetryPath(error: string, next: string | null | undefined) {
  return `/login?${new URLSearchParams({error, next:safeAuthReturnPath(next)})}`;
}
