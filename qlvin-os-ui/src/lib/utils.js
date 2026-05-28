export function formatCurrency(value, currency = "SAR") {
  return `${Number(value).toLocaleString()} ${currency}`;
}

export function formatPercent(value) {
  const n = parseFloat(value);
  return `${n > 0 ? "+" : ""}${n}%`;
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
