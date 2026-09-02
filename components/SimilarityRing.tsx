import { brandColors, neutralColors } from '@/design-tokens';

/**
 * How similar an alternative is to the destination it is being offered
 * against, as a small ring with the percentage in the middle.
 *
 * Drawn with two SVG circles and a dash offset — no chart library. Recharts is
 * for the contribution bars; a single arc does not need it.
 *
 * Brand green rather than a band colour on purpose. The band colours mean
 * visitor pressure everywhere else in the app, and a ring that filled up red
 * would read as a warning when it means the opposite.
 */

const SIZE = 48;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function SimilarityRing({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const filled = (clamped / 100) * CIRCUMFERENCE;

  return (
    <div
      className="shrink-0"
      role="img"
      aria-label={`${clamped}% similar`}
      title={`${clamped}% similar to the destination you were looking at`}
    >
      <svg width={SIZE} height={SIZE} focusable="false">
        {/* Rotated so the arc starts at the top rather than at three o'clock. */}
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={neutralColors.line}
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={brandColors.DEFAULT}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
          />
        </g>
        <text
          x={SIZE / 2}
          y={SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fontWeight={600}
          fill={neutralColors.ink}
        >
          {clamped}
        </text>
      </svg>
      <p className="mt-0.5 text-center text-[10px] leading-none text-muted">
        % similar
      </p>
    </div>
  );
}
