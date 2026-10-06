type MoreLogoProps = {
  size?: "hero" | "compact" | "navigation";
  className?: string;
  tagline?: boolean;
};

/** Transparent vector mark: an open, moving posture without a walking-specific motif. */
export function MoreLogo({ size = "compact", className = "", tagline = false }: MoreLogoProps) {
  return (
    <span className={`more-logo more-logo--${size} ${className}`} role="img" aria-label={tagline ? "MoRe ระบบฟื้นฟูผู้ป่วย" : "MoRe"}>
      <svg className="more-logo__symbol" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
        <circle cx="26" cy="9" r="4" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 25C15 23 18 18 25 18C30 18 33 23 39 20" />
          <path d="M25 18L22 29" />
          <path d="M22 29L13 40M22 29L31 35L39 35" />
        </g>
      </svg>
      <span className="more-logo__type" aria-hidden="true">
        <span className="more-logo__word">MoRe</span>
        {tagline && <small>ระบบฟื้นฟูผู้ป่วย</small>}
      </span>
    </span>
  );
}
