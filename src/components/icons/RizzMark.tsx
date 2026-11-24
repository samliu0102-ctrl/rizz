// The Rizz mark: a martini glass with an olive. Mirrors the tray icon.
const RizzMark = ({
  width,
  height,
  size,
  className,
}: {
  width?: number | string;
  height?: number | string;
  size?: number | string;
  className?: string;
}) => (
  <svg
    width={width ?? size ?? 24}
    height={height ?? size ?? 24}
    viewBox="0 0 64 64"
    className={className}
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <g transform="translate(0 3)">
      <path d="M11 13H53L32 36Z" strokeWidth={4} />
      <path d="M28 24L45 5" strokeWidth={3} />
      <circle cx="27.5" cy="24.5" r="5" fill="currentColor" stroke="none" />
      <rect
        x="30.4"
        y="34"
        width="3.2"
        height="16"
        fill="currentColor"
        stroke="none"
      />
      <rect
        x="21"
        y="48.5"
        width="22"
        height="4"
        rx="2"
        fill="currentColor"
        stroke="none"
      />
    </g>
  </svg>
);

export default RizzMark;
