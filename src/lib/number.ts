export const fmtUsd = (n?: number | null) =>
  typeof n === 'number' && isFinite(n) ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '$0';

export const fmtUsdPrecise = (n?: number | null) =>
  typeof n === 'number' && isFinite(n) ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '$0';

export const fmtNum = (n?: number | null) =>
  typeof n === 'number' && isFinite(n) ? n.toLocaleString('en-US') : '0';

export const fmtPct = (n?: number | null) => {
  if (typeof n !== 'number' || !isFinite(n)) return '0%';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
};