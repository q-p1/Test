export function ProgressRing({ value, total, label }: { value: number; total: number; label: string }) {
  const safeTotal = Math.max(1, total);
  const progress = Math.min(1, Math.max(0, value / safeTotal));
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      className="progress-ring"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(total, Math.max(0, value))}
      aria-valuetext={`${value} من ${total}`}
    >
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <circle className="progress-ring__track" cx="30" cy="30" r={radius} />
        <circle
          className="progress-ring__value"
          cx="30"
          cy="30"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <strong>{value}<small>/{total}</small></strong>
    </div>
  );
}
