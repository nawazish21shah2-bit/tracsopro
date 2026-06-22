export function usageRow(used: number, max: number) {
  return {
    used,
    max,
    percent: max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0,
  };
}
