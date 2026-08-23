const normalizeApiBaseUrl = (value?: string): string => {
  const rawValue = value?.trim();

  if (!rawValue || rawValue === '/' || rawValue.toLowerCase() === 'auto') {
    return '';
  }

  return rawValue.replace(/\/+$/, '');
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${API_BASE_URL}${normalizedPath}`;
};

