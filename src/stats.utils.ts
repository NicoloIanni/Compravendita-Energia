// Funzione di utilità per il calcolo delle statistiche
// Riceve un array di valori numerici (percentuali di vendita)
export function calcStats(values: number[]) {

  // Caso limite: nessun valore disponibile
  // Ritorna tutte le statistiche a zero
  // (evita divisioni per zero e NaN)
  if (values.length === 0) {
    return {
      minPercent: 0,
      maxPercent: 0,
      avgPercent: 0,
      stdDev: 0,
    };
  }

  // Calcolo del valore minimo
  const min = Math.min(...values);

  // Calcolo del valore massimo
  const max = Math.max(...values);

  // Calcolo della media aritmetica
  const avg =
    values.reduce((s, v) => s + v, 0) / values.length;

  // Calcolo della varianza:
  // media degli scarti quadratici dalla media
  const variance =
    values.reduce(
      (s, v) => s + Math.pow(v - avg, 2),
      0
    ) / values.length;

  // Deviazione standard (radice quadrata della varianza)
  const stdDev = Math.sqrt(variance);

  // Ritorna le statistiche arrotondate a due decimali
  // Formato pronto per API / frontend / grafici
  return {
    minPercent: Number(min.toFixed(2)),
    maxPercent: Number(max.toFixed(2)),
    avgPercent: Number(avg.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
  };
}
