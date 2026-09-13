/**
 * EventMasters Logo Component
 * variant="lockup"  — full horizontal wordmark with icon (navbar default)
 * variant="icon"    — standalone ticket-E mark only (favicon, small contexts)
 * variant="stacked" — icon above wordmark (hero / splash)
 */
export default function Logo({ variant = 'lockup', height = 36, className = '' }) {
  if (variant === 'icon') {
    return (
      <svg
        height={height}
        viewBox="0 0 60 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="EventMasters"
        role="img"
      >
        {/* Ticket body */}
        <rect x="0" y="0" width="48" height="52" rx="7" fill="#F5A623"/>
        {/* Tear-off stub */}
        <rect x="38" y="0" width="14" height="52" rx="0" fill="#C47A10"/>
        <path d="M43 0 h3 a7 7 0 0 1 7 7 v38 a7 7 0 0 1 -7 7 h-3 Z" fill="#B06800"/>
        {/* Perforation dots */}
        <circle cx="41" cy="9"  r="2" fill="#070B18" opacity="0.3"/>
        <circle cx="41" cy="21" r="2" fill="#070B18" opacity="0.3"/>
        <circle cx="41" cy="33" r="2" fill="#070B18" opacity="0.3"/>
        <circle cx="41" cy="45" r="2" fill="#070B18" opacity="0.3"/>
        {/* E letterform */}
        <rect x="8"  y="10" width="24" height="7" rx="2" fill="#070B18"/>
        <rect x="8"  y="23" width="18" height="7" rx="2" fill="#070B18"/>
        <rect x="8"  y="36" width="24" height="7" rx="2" fill="#070B18"/>
        <rect x="8"  y="10" width="6"  height="33"       fill="#070B18"/>
      </svg>
    );
  }

  if (variant === 'stacked') {
    return (
      <svg
        height={height * 2.4}
        viewBox="0 0 160 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="EventMasters"
        role="img"
      >
        {/* Icon centred */}
        <rect x="50" y="0" width="48" height="42" rx="6" fill="#F5A623"/>
        <rect x="87" y="0" width="11" height="42" rx="0" fill="#C47A10"/>
        <path d="M91 0 h3 a6 6 0 0 1 6 6 v30 a6 6 0 0 1 -6 6 h-3 Z" fill="#B06800"/>
        <circle cx="89" cy="7"  r="1.8" fill="#070B18" opacity="0.3"/>
        <circle cx="89" cy="17" r="1.8" fill="#070B18" opacity="0.3"/>
        <circle cx="89" cy="27" r="1.8" fill="#070B18" opacity="0.3"/>
        <circle cx="89" cy="37" r="1.8" fill="#070B18" opacity="0.3"/>
        <rect x="58" y="8"  width="22" height="6" rx="2" fill="#070B18"/>
        <rect x="58" y="19" width="16" height="6" rx="2" fill="#070B18"/>
        <rect x="58" y="30" width="22" height="6" rx="2" fill="#070B18"/>
        <rect x="58" y="8"  width="5"  height="28"       fill="#070B18"/>
        {/* Wordmark below */}
        <text x="80" y="64" textAnchor="middle" fontFamily="'Bebas Neue', sans-serif" fontSize="22" fill="#F5F2EA" letterSpacing="1.5">EVENT</text>
        <text x="80" y="80" textAnchor="middle" fontFamily="'Bebas Neue', sans-serif" fontSize="14" fill="#F5A623" letterSpacing="4">MASTERS</text>
      </svg>
    );
  }

  // Default: lockup (icon + horizontal wordmark)
  return (
    <svg
      height={height}
      viewBox="0 0 220 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="EventMasters"
      role="img"
    >
      {/* Ticket icon */}
      <rect x="0" y="2" width="32" height="32" rx="5" fill="#F5A623"/>
      <rect x="25" y="2" width="9"  height="32" rx="0" fill="#C47A10"/>
      <path d="M28 2 h2 a5 5 0 0 1 5 5 v22 a5 5 0 0 1 -5 5 h-2 Z" fill="#B06800"/>
      <circle cx="27" cy="8"  r="1.6" fill="#070B18" opacity="0.35"/>
      <circle cx="27" cy="16" r="1.6" fill="#070B18" opacity="0.35"/>
      <circle cx="27" cy="24" r="1.6" fill="#070B18" opacity="0.35"/>
      <circle cx="27" cy="30" r="1.6" fill="#070B18" opacity="0.35"/>
      {/* E letterform */}
      <rect x="5"  y="8"  width="16" height="5" rx="1.5" fill="#070B18"/>
      <rect x="5"  y="16" width="12" height="5" rx="1.5" fill="#070B18"/>
      <rect x="5"  y="24" width="16" height="5" rx="1.5" fill="#070B18"/>
      <rect x="5"  y="8"  width="4"  height="21"         fill="#070B18"/>

      {/* Wordmark */}
      <text x="46" y="27" fontFamily="'Bebas Neue', 'Arial Black', sans-serif" fontSize="28" fill="#F5F2EA" letterSpacing="1">EVENT</text>
      <text x="130" y="27" fontFamily="'Bebas Neue', 'Arial Black', sans-serif" fontSize="28" fill="#F5A623" letterSpacing="2">MASTERS</text>
    </svg>
  );
}
