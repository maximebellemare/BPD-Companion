const WIN_BACK_HOST = 'bpdcompanionapp.com';
const WIN_BACK_PATH = '/win-back';
const CUSTOM_SCHEME = 'bpd-companion:';
const CUSTOM_SCHEME_PREFIX = 'bpd-companion:';

function normalizeOffer(value: string | null): 'discount' | 'lifetime' | null {
  if (value === 'discount' || value === 'lifetime') return value;
  return null;
}

function buildWinBackPath(searchParams: URLSearchParams): string {
  const offer = normalizeOffer(searchParams.get('offer')) ?? 'discount';
  return `${WIN_BACK_PATH}?offer=${offer}`;
}

export function normalizeNativeSystemPath(path: string): string {
  if (!path) return '/';

  if (path === 'win-back' || path.startsWith('win-back?') || path.startsWith('win-back/')) {
    const parsed = new URL(`/${path}`, 'https://bpdcompanionapp.com');
    return buildWinBackPath(parsed.searchParams);
  }

  if (path.startsWith(WIN_BACK_PATH)) {
    const parsed = new URL(path, 'https://bpdcompanionapp.com');
    return buildWinBackPath(parsed.searchParams);
  }

  if (path.startsWith(CUSTOM_SCHEME_PREFIX) && !path.startsWith(`${CUSTOM_SCHEME_PREFIX}//`)) {
    const customPath = path.slice(CUSTOM_SCHEME_PREFIX.length);
    const parsed = new URL(customPath.startsWith('/') ? customPath : `/${customPath}`, 'https://bpdcompanionapp.com');
    if (parsed.pathname === WIN_BACK_PATH || parsed.pathname === `${WIN_BACK_PATH}/`) {
      return buildWinBackPath(parsed.searchParams);
    }
  }

  try {
    const parsed = new URL(path);
    if (parsed.protocol === 'https:' && parsed.hostname === WIN_BACK_HOST && parsed.pathname === WIN_BACK_PATH) {
      return buildWinBackPath(parsed.searchParams);
    }

    if (parsed.protocol === CUSTOM_SCHEME && parsed.hostname === 'win-back') {
      return buildWinBackPath(parsed.searchParams);
    }

    if (parsed.protocol === CUSTOM_SCHEME && (parsed.pathname === WIN_BACK_PATH || parsed.pathname === `${WIN_BACK_PATH}/`)) {
      return buildWinBackPath(parsed.searchParams);
    }
  } catch {
    return path.startsWith('/') ? path : '/';
  }

  return path;
}

export function sanitizeNativePathForDebug(path: string | null): string | null {
  if (!path) return path;

  const normalized = normalizeNativeSystemPath(path);
  if (normalized.startsWith(WIN_BACK_PATH)) return normalized;

  try {
    const parsed = new URL(path);
    const withoutSearch = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    return parsed.search ? `${withoutSearch}?[redacted]` : withoutSearch;
  } catch {
    const [pathname, search] = path.split('?');
    return search ? `${pathname}?[redacted]` : path;
  }
}
