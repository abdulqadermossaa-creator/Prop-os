export default function StatDelta({ value }) {
  const isPositive = value?.startsWith("+");
  const isNeutral = !value?.startsWith("+") && !value?.startsWith("-");

  const color = isNeutral
    ? "text-gray-400"
    : isPositive
    ? "text-success"
    : "text-danger";

  return <span className={`text-xs font-medium ${color}`}>{value}</span>;
}
