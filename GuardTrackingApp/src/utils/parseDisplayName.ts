/**
 * Split a display name into first/last for avatars and labels.
 * Strips parenthetical suffixes like " (Site Name)" from chat titles.
 */
export function parseDisplayName(fullName?: string): { firstName: string; lastName: string } {
  const base = (fullName || '').split(' (')[0].trim();
  const parts = base.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: 'User', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}
