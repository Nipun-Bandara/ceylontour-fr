'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { contributionColors, neutralColors } from '@/design-tokens';
import {
  barsAccountForScore,
  prepareExplanation,
  type ContributionBar,
  type PreparedExplanation,
} from '@/lib/contributions';
import type { Contribution } from '@/types/api';

/**
 * The XAI explanation panel (F3) — the highest-marked part of the project.
 *
 * Answers "Why was this recommended?" with horizontal contribution bars and
 * the API's plain-language sentence underneath.
 *
 * ## The distinction this panel exists to make
 *
 * Two kinds of number end up side by side here, and they are not equally
 * certain:
 *
 *   - **exact** — index contributions, arithmetic on the weights
 *   - **estimated** — TreeSHAP values from the pressure model, inference
 *
 * Showing them as equally certain would defeat the point of building an
 * explainable system. They are separated three ways, so no single one of them
 * has to carry it:
 *
 *   1. **fill** — solid versus a diagonal hatch
 *   2. **outline** — estimated bars are stroked, exact bars are not
 *   3. **text** — estimated bars are marked `est.` next to the percentage
 *
 * Colour is deliberately *not* on that list. It is there as reinforcement, but
 * the hatch, the outline and the `est.` marker all survive being printed in
 * greyscale or read by someone with colour blindness. The tooltip is the
 * fourth layer and the only optional one — F3 requires the difference to be
 * visible *without* reading it.
 *
 * Recharts is used for the contribution bars. The thin total bar above them is
 * hand-drawn SVG, because it is a single stacked strip rather than a chart and
 * this way it shares the exact hatch pattern definition with the bars.
 */

/** The two sentences F3 requires. Used in the legend and in the tooltips. */
const KIND_DESCRIPTION: Record<ContributionBar['type'], string> = {
  exact: 'calculated directly from the sustainability weights',
  estimated: 'a model estimate, not an exact calculation',
};

const KIND_HEADING: Record<ContributionBar['type'], string> = {
  exact: 'Solid bar',
  estimated: 'Hatched, outlined bar',
};

/** Height of one bar row, including its gap. */
const ROW_HEIGHT = 30;
/** Width reserved for the factor names down the left. */
const LABEL_WIDTH = 96;
/**
 * Reports how wide an element currently is, or 0 when it is not on screen.
 *
 * The chart is sized from this and only mounts once the number is above zero.
 * Three approaches were tried before this one and all three failed on a phone:
 *
 *   - `ResponsiveContainer` measures once on mount. Mounted inside the
 *     collapsed panel it measures zero and never recovers, and carried from a
 *     wide viewport to a narrow one it keeps the old width and draws a 924px
 *     chart inside a 343px card.
 *   - A `matchMedia` query tells you the viewport width, not whether this
 *     particular box is visible, and it did not fire on a programmatic resize.
 *   - A `ResizeObserver` never fires at all for an element that starts inside
 *     `display: none` — not on observe, and not when it is later revealed.
 *     Verified in the browser rather than assumed.
 *
 * So the measurement is taken explicitly: once on mount, again whenever
 * `remeasureOn` changes, and on window resize. Collapsed means no box and a
 * width of 0, which unmounts the chart; expanding changes `remeasureOn` and
 * measures the box that now exists. Nothing here needs to know where the `sm:`
 * breakpoint is.
 */
function useMeasuredWidth<T extends HTMLElement>(
  remeasureOn: unknown
): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const measure = () =>
      setWidth(ref.current?.getBoundingClientRect().width ?? 0);

    // Measured twice on purpose. The immediate call is right in the ordinary
    // case, but when the panel mounts as part of an async update — the risk
    // view swapping its loading skeleton for the forecast — the box is not
    // always at its final width yet and the first reading comes back 0. The
    // follow-up on the next frame is after layout has settled and corrects it.
    measure();
    const frame = requestAnimationFrame(measure);

    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
    };
  }, [remeasureOn]);

  return [ref, width];
}

/**
 * The diagonal hatch every estimated bar is filled with.
 *
 * Declared once per panel in its own zero-sized SVG, and referenced by id from
 * the legend swatch, the total strip and the chart bars. An SVG paint server
 * resolves across the whole document, so one definition serves all three.
 *
 * It lives here rather than inside the chart because Recharts drops `<defs>`
 * children it does not recognise — put it in the `<BarChart>` and it silently
 * never reaches the DOM, leaving the bars referencing an id that does not
 * exist. Keeping it standalone makes the dependency explicit instead of
 * leaving the hatch to borrow a definition from whichever other SVG happens to
 * still be on the page.
 *
 * `patternUnits="userSpaceOnUse"` keeps the stripe spacing constant however
 * wide the bar is.
 */
function HatchDefs({ id }: { id: string }) {
  return (
    <svg
      width={0}
      height={0}
      aria-hidden="true"
      focusable="false"
      className="absolute"
    >
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width={6}
          height={6}
          patternTransform="rotate(45)"
        >
          <rect width={6} height={6} fill={neutralColors.card} />
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={6}
            stroke={contributionColors.estimated}
            strokeWidth={2.5}
          />
        </pattern>
      </defs>
    </svg>
  );
}

function fillFor(type: ContributionBar['type'], patternId: string): string {
  return type === 'exact' ? contributionColors.exact : `url(#${patternId})`;
}

/** A small square in the legend, drawn exactly like the bars it describes. */
function LegendSwatch({
  type,
  patternId,
}: {
  type: ContributionBar['type'];
  patternId: string;
}) {
  return (
    <svg width={18} height={14} aria-hidden="true" className="shrink-0">
      <rect
        x={0.75}
        y={0.75}
        width={16.5}
        height={12.5}
        fill={fillFor(type, patternId)}
        stroke={
          type === 'estimated' ? contributionColors.estimated : 'transparent'
        }
        strokeWidth={1.5}
      />
    </svg>
  );
}

/**
 * One line per bar style, above the chart, so the encoding is taught first.
 *
 * Only the styles actually on screen are listed. On the risk view every bar is
 * a SHAP value, and a line reading "solid bar — calculated directly from the
 * sustainability weights" would be describing something that is not there and
 * a calculation that is not involved.
 */
function Legend({
  kinds,
  patternId,
}: {
  kinds: ReadonlyArray<ContributionBar['type']>;
  patternId: string;
}) {
  return (
    <ul className="space-y-1.5">
      {kinds.map((type) => (
        <li key={type} className="flex items-start gap-2 text-xs text-ink">
          <span className="mt-0.5">
            <LegendSwatch type={type} patternId={patternId} />
          </span>
          <span>
            <span className="font-medium">{KIND_HEADING[type]}</span> —{' '}
            {KIND_DESCRIPTION[type]}
            {type === 'estimated' && (
              <>
                , marked <span className="font-medium">est.</span>
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The thin total bar (F3: "bars visually sum to the total score").
 *
 * Every contribution laid end to end on the same 0–100 scale the chart below
 * uses. The strip ends where the score ends, which is what makes the sum
 * visible rather than something the reader has to take on trust.
 */
function TotalBar({
  prepared,
  totalLabel,
  patternId,
}: {
  prepared: PreparedExplanation;
  totalLabel: string;
  patternId: string;
}) {
  let offset = 0;

  return (
    <svg
      width="100%"
      height={14}
      role="img"
      aria-label={`The parts below add up to a ${totalLabel} of ${prepared.score} out of 100.`}
      className="block"
    >
      {/* The unfilled remainder, so 100 is always the frame of reference. */}
      <rect x={0} y={0} width="100%" height={14} fill={neutralColors.line} />
      {prepared.bars.map((bar) => {
        const x = offset;
        offset += bar.points;
        return (
          <rect
            key={bar.key}
            x={`${x}%`}
            y={0}
            width={`${bar.points}%`}
            height={14}
            fill={fillFor(bar.type, patternId)}
            stroke={
              bar.type === 'estimated'
                ? contributionColors.estimated
                : 'transparent'
            }
            strokeWidth={bar.type === 'estimated' ? 1 : 0}
          />
        );
      })}
    </svg>
  );
}

interface TooltipPayloadItem {
  payload: ContributionBar;
}

/**
 * F3 requires a tooltip on both kinds. It is the fourth layer of the
 * distinction, never the only one — the hatch, outline and `est.` marker
 * already carry it for anyone who never hovers, or cannot.
 */
function ContributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  const bar = payload?.[0]?.payload;
  if (!active || !bar) return null;

  return (
    <div className="max-w-[15rem] rounded border border-line bg-white p-2 text-xs shadow-sm">
      <p className="font-semibold text-ink">
        {bar.label} — {bar.percent}%
      </p>
      <p className="mt-1 text-muted">{bar.points} points of the total.</p>
      <p className="mt-1 text-ink">{KIND_DESCRIPTION[bar.type]}.</p>
    </div>
  );
}

export interface ExplanationPanelProps {
  /** The question the panel answers. */
  heading: string;
  /**
   * The number the bars add up to — a Sustainability Score on a result card,
   * the forecast pressure on the risk view. Both are 0 to 100.
   */
  total: number;
  /** What that number is called, e.g. `Sustainability Score`. */
  totalLabel: string;
  contributions: readonly Contribution[];
  /** The plain-language sentence, already templated by the API. */
  explanation: string;
}

/**
 * Takes contributions, a total and a sentence — deliberately not a
 * `Recommendation`. F4 needs exactly this panel for the SHAP breakdown, where
 * the total is a forecast pressure rather than a score and every bar is
 * estimated. Widening the props was the whole of that work; there is one bar
 * component in this app and there should stay one.
 */
export default function ExplanationPanel({
  heading,
  total,
  totalLabel,
  contributions,
  explanation,
}: ExplanationPanelProps) {
  // Ids have to be unique per panel — several of these render on one page and
  // each has its own <defs>. The colons React puts in a useId are stripped
  // because they are awkward inside a url(#…) reference.
  const rawId = useId().replace(/:/g, '');
  const patternId = `hatch-${rawId}`;
  const contentId = `explanation-${rawId}`;

  const [expanded, setExpanded] = useState(false);
  const [chartRef, chartWidth] = useMeasuredWidth<HTMLDivElement>(expanded);

  const prepared = prepareExplanation(contributions, total);
  const complete = barsAccountForScore(prepared);

  if (prepared.bars.length === 0) {
    return (
      <div className="rounded border border-line p-3">
        <p className="text-sm text-muted">
          No explanation was returned for this destination.
        </p>
      </div>
    );
  }

  const chartHeight = prepared.bars.length * ROW_HEIGHT + 8;

  // Only the bar styles actually present get a legend line.
  const kinds = (['exact', 'estimated'] as const).filter((type) =>
    prepared.bars.some((bar) => bar.type === type)
  );

  /**
   * The percentage sitting at the end of each bar, plus the `est.` marker.
   * Written as a closure rather than a component so it can read `prepared`
   * without Recharts having to pass the whole row through.
   */
  const renderPercentLabel = (props: {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    index?: number;
  }) => {
    const bar = prepared.bars[props.index ?? -1];
    if (!bar) return null;
    const x = Number(props.x ?? 0) + Number(props.width ?? 0) + 6;
    const y = Number(props.y ?? 0) + Number(props.height ?? 0) / 2;
    return (
      <text
        x={x}
        y={y}
        dominantBaseline="middle"
        fontSize={11}
        fill={neutralColors.ink}
      >
        {bar.percent}%
        {bar.type === 'estimated' && (
          <tspan fill={contributionColors.estimated} fontWeight={600}>
            {' '}
            est.
          </tspan>
        )}
      </text>
    );
  };

  return (
    <div className="relative rounded border border-line p-3">
      <HatchDefs id={patternId} />
      {/*
        Collapsible on a phone, always open from `sm` up. Done with CSS rather
        than a JavaScript media query so the server and the browser render the
        same markup and hydration does not mismatch: the content is always in
        the DOM with `hidden sm:block`, and the toggle only exists below `sm`.
      */}
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-2 text-left sm:hidden"
      >
        <span className="text-sm font-semibold text-ink">{heading}</span>
        <span aria-hidden="true" className="text-xs text-muted">
          {expanded ? 'Hide ▲' : 'Show ▼'}
        </span>
      </button>

      <h4 className="hidden text-sm font-semibold text-ink sm:block">
        {heading}
      </h4>

      <div
        id={contentId}
        className={`${expanded ? 'block' : 'hidden'} mt-3 sm:mt-3 sm:block`}
      >
        <Legend kinds={kinds} patternId={patternId} />

        <div className="mt-3">
          <div className="mb-1 flex items-baseline justify-between text-xs text-muted">
            <span>{totalLabel}</span>
            <span className="font-semibold text-ink">
              {prepared.score} / 100
            </span>
          </div>
          <TotalBar
            prepared={prepared}
            totalLabel={totalLabel}
            patternId={patternId}
          />
          <p className="mt-1 text-[11px] text-muted">
            {complete
              ? `The bars below are the parts of this ${totalLabel.toLowerCase()}, and add up to it.`
              : `These bars cover ${prepared.shownPercent}% of the reasons; ${
                  prepared.hiddenCount === 1
                    ? '1 smaller factor is'
                    : `${prepared.hiddenCount} smaller factors are`
                } not shown.`}
          </p>
        </div>

        {/*
          A chart is invisible to a screen reader, so the same numbers are
          repeated here as text. This is the panel's real accessible content;
          the SVG below is decoration on top of it.
        */}
        <ul className="sr-only">
          {prepared.bars.map((bar) => (
            <li key={`sr-${bar.key}`}>
              {bar.label}: {bar.percent}% of the reason, {bar.points} points of
              the {totalLabel.toLowerCase()}. {KIND_DESCRIPTION[bar.type]}.
            </li>
          ))}
        </ul>

        <div
          ref={chartRef}
          aria-hidden="true"
          className="mt-2"
          style={{ minHeight: chartHeight }}
        >
          {chartWidth > 0 && (
            <BarChart
              width={chartWidth}
              height={chartHeight}
              data={prepared.bars}
              layout="vertical"
              margin={{ top: 4, right: 52, bottom: 4, left: 0 }}
              barCategoryGap={6}
            >
              {/*
                Fixed 0–100 domain. Without it Recharts scales to the largest
                bar, which would make a 32% contribution fill the row and make
                every destination look identical.
              */}
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="label"
                width={LABEL_WIDTH}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: neutralColors.ink }}
              />
              <Tooltip
                content={<ContributionTooltip />}
                cursor={{ fill: neutralColors.surface }}
              />
              <Bar dataKey="points" isAnimationActive={false} minPointSize={2}>
                {prepared.bars.map((bar) => (
                  <Cell
                    key={bar.key}
                    fill={fillFor(bar.type, patternId)}
                    stroke={
                      bar.type === 'estimated'
                        ? contributionColors.estimated
                        : 'transparent'
                    }
                    strokeWidth={bar.type === 'estimated' ? 1.5 : 0}
                  />
                ))}
                <LabelList dataKey="percent" content={renderPercentLabel} />
              </Bar>
            </BarChart>
          )}
        </div>

        {/* The sentence from the API. Fixed templates, filled server-side —
            nothing here generates or edits it. */}
        <p className="mt-3 border-t border-line pt-3 text-base leading-relaxed text-ink">
          {explanation}
        </p>
      </div>
    </div>
  );
}
