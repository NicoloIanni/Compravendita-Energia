export function calcStats(values: number[]) {
  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;

  const variance =
    values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;

  const std = Math.sqrt(variance);

  return { min, max, avg, std };
}
