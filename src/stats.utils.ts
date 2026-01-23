export function calcStats(values: number[]) {
  if (values.length === 0) {
    return {
      minPercent: 0,
      maxPercent: 0,
      avgPercent: 0,
      stdDev: 0,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;

  const variance =
    values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;

  const stdDev = Math.sqrt(variance);

  return {
    minPercent: Number(min.toFixed(2)),
    maxPercent: Number(max.toFixed(2)),
    avgPercent: Number(avg.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
  };
}
