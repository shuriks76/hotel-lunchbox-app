type ColorToken = 'gold' | 'open' | 'warn';

const STROKE_COLOR: Record<ColorToken, string> = {
  gold: 'rgb(var(--color-gold))',
  open: 'rgb(var(--color-open))',
  warn: 'rgb(var(--color-warn))',
};

type Props = {
  icon: string;
  label: string;
  count: number;
  percent: number; // 0..100, доля от всех текущих жильцов отеля
  color: ColorToken;
};

/**
 * Круговой индикатор "сколько заказано этого типа питания, в процентах
 * от всех заселённых жильцов отеля прямо сейчас". Чисто декоративно-
 * информационный элемент — чтобы сводка не была сплошными
 * прямоугольниками.
 */
export default function MealRing({ icon, label, count, percent, color }: Props) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgb(var(--color-border))"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={STROKE_COLOR[color]}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink leading-none">
            {count}
          </span>
          <span className="text-xs text-ink-muted mt-0.5">
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      <span className="text-xs text-ink-muted flex items-center gap-1">
        <span aria-hidden="true">{icon}</span>
        {label}
      </span>
    </div>
  );
}
