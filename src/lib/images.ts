const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

const isAbsoluteUrl = (value: string) => /^(?:https?:|data:|blob:|file:)/i.test(value);

export const resolveImageUrl = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  if (isAbsoluteUrl(value)) {
    return value;
  }

  const normalized = value.replace(/^\/+/, '');

  if (!API_BASE_URL) {
    return `/${normalized}`;
  }

  return `${API_BASE_URL}/${normalized}`;
};
