import type { SVGProps } from 'react';

type GlyphProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function baseProps({ size = 24, ...rest }: GlyphProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true as const,
    ...rest,
  };
}

/** Classic party balloon with shine + knot + string. */
export function AmbientBalloonGlyph({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <ellipse cx="12" cy="9.2" rx="7" ry="8.2" />
      <ellipse cx="9.2" cy="6.4" rx="2.4" ry="3.2" fill="white" opacity="0.5" />
      <path d="M12 17.2c-.7 0-1.3.4-1.5 1.1L9.8 20h4.4l-.7-1.7c-.2-.7-.8-1.1-1.5-1.1Z" />
      <path
        d="M12 20c0 1.4.3 2.4.8 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function AmbientBalloonRound({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <circle cx="12" cy="9.5" r="7.4" />
      <circle cx="9.4" cy="7" r="2.3" fill="white" opacity="0.48" />
      <path d="M12 16.8 10.6 19.2h2.8Z" />
      <path
        d="M12 19.2v3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function AmbientBalloonHeart({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path d="M12 20.2C8.2 16.8 4.5 13.4 4.5 9.6c0-2.6 2-4.6 4.4-4.6 1.4 0 2.6.7 3.1 1.8.5-1.1 1.7-1.8 3.1-1.8 2.4 0 4.4 2 4.4 4.6 0 3.8-3.7 7.2-7.5 10.6Z" />
      <ellipse cx="9.2" cy="8.2" rx="1.6" ry="2" fill="white" opacity="0.4" />
    </svg>
  );
}

/** Classic 6-point snowflake with clear arms. */
export function AmbientSnowflake({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v18M5.2 6.5l13.6 11M5.2 17.5l13.6-11" />
        <path d="M12 6.2 10.2 4.8M12 6.2l1.8-1.4M12 17.8l-1.8 1.4M12 17.8l1.8 1.4" />
        <path d="M7.2 8.2 5.4 7.6M7.2 8.2l.2-2M16.8 15.8l1.8.6M16.8 15.8l-.2 2" />
        <path d="M7.2 15.8 5.4 16.4M7.2 15.8l.2 2M16.8 8.2l1.8-.6M16.8 8.2l-.2-2" />
      </g>
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="0.9" fill="white" opacity="0.55" />
    </svg>
  );
}

export function AmbientSnowflakeSoft({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <circle cx="12" cy="12" r="2.2" />
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 3.5v4.2M12 16.3v4.2M3.5 12h4.2M16.3 12h4.2" />
        <path d="M6.2 6.2l3 3M14.8 14.8l3 3M17.8 6.2l-3 3M9.2 14.8l-3 3" />
      </g>
      <circle cx="12" cy="5.2" r="1.1" />
      <circle cx="12" cy="18.8" r="1.1" />
      <circle cx="5.2" cy="12" r="1.1" />
      <circle cx="18.8" cy="12" r="1.1" />
    </svg>
  );
}

export function AmbientFrostFlake({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path d="M12 2.4 13.2 8.1 18.8 5.6 15.4 10.2 21.2 12 15.4 13.8 18.8 18.4 13.2 15.9 12 21.6 10.8 15.9 5.2 18.4 8.6 13.8 2.8 12 8.6 10.2 5.2 5.6 10.8 8.1Z" opacity="0.95" />
      <path
        d="M12 6.5v11M7.5 8.8l9 6.4M7.5 15.2l9-6.4"
        fill="none"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="12" cy="12" r="2" fill="white" opacity="0.45" />
    </svg>
  );
}

export function AmbientCrystal({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path d="M8.2 4.2h7.6L20 10.5 12 21.2 4 10.5Z" opacity="0.92" />
      <path d="M8.2 4.2 12 10.5 15.8 4.2Z" fill="white" opacity="0.4" />
      <path d="M4 10.5h16L12 21.2Z" fill="white" opacity="0.12" />
      <path d="M12 10.5V21.2" fill="none" stroke="white" strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

export function AmbientIceShard({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path d="M11 2.5 17.5 9.2 13.8 21.5 6.5 14.8Z" opacity="0.9" />
      <path d="M11 2.5 17.5 9.2 12.2 10.5Z" fill="white" opacity="0.4" />
      <path
        d="M9.2 8.5 14.8 13.8"
        fill="none"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

export function AmbientWindSwirl({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M3.2 8.2h12a2.7 2.7 0 1 0-1.9-4.5"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M3.2 12.5h14.5a2.9 2.9 0 1 1-2 4.9"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M3.2 16.8h9"
        opacity="0.7"
      />
    </svg>
  );
}

export function AmbientCloudMist({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <ellipse cx="9.2" cy="14" rx="5.4" ry="3.8" opacity="0.5" />
      <ellipse cx="15.2" cy="12.4" rx="6" ry="4.2" opacity="0.72" />
      <ellipse cx="11.8" cy="10.6" rx="4.6" ry="3.4" opacity="0.88" />
      <ellipse cx="11.5" cy="9.2" rx="2.6" ry="1.7" fill="white" opacity="0.38" />
    </svg>
  );
}

export function AmbientDroplet({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path d="M12 2.5c3 4.2 6.5 7.8 6.5 11.4a6.5 6.5 0 1 1-13 0C5.5 10.3 9 6.7 12 2.5Z" />
      <ellipse cx="10" cy="12.2" rx="1.7" ry="2.6" fill="white" opacity="0.48" />
    </svg>
  );
}

export function AmbientBubble({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="7.2" opacity="0.16" />
      <circle cx="9" cy="8.8" r="2.4" fill="white" opacity="0.55" />
      <circle cx="15.2" cy="14.8" r="1.2" fill="white" opacity="0.28" />
    </svg>
  );
}

export function AmbientSparkle({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path d="M12 1.8 14.1 9 21.2 11 14.1 13 12 20.2 9.9 13 2.8 11 9.9 9Z" />
      <path d="M18.8 3.8 19.6 6.8 22.6 7.6 19.6 8.4 18.8 11.4 18 8.4 15 7.6 18 6.8Z" opacity="0.9" />
    </svg>
  );
}

export function AmbientStar({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path d="M12 2.2 14.4 9.1 21.5 9.4 15.8 13.6 17.7 20.6 12 16.7 6.3 20.6 8.2 13.6 2.5 9.4 9.6 9.1Z" />
      <circle cx="12" cy="11.6" r="1.6" fill="white" opacity="0.35" />
    </svg>
  );
}

export function AmbientLeaf({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path d="M19.8 4.2c-5.4-.5-10.8 2.3-13.2 7.6-1.9 4-.8 7.9 2.6 9.8 3.5 2 7.9.4 10.1-3.4 2.9-4.8 2.4-10.6.5-14Z" />
      <path
        d="M8 19c2.5-2.9 5.8-6 10.6-7.9"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

export function AmbientConfettiPiece({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <rect x="4.5" y="3.5" width="6.5" height="11" rx="1.3" transform="rotate(-20 7.75 9)" />
      <rect x="13" y="7" width="5.5" height="10" rx="1.1" transform="rotate(24 15.75 12)" opacity="0.88" />
    </svg>
  );
}

export function AmbientHeart({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path d="M12 20.6C7.8 17 4.2 13.4 4.2 9.8c0-2.7 2.1-4.8 4.6-4.8 1.5 0 2.8.8 3.2 2 .4-1.2 1.7-2 3.2-2 2.5 0 4.6 2.1 4.6 4.8 0 3.6-3.6 7.2-7.8 10.8Z" />
      <ellipse cx="9.2" cy="8.8" rx="1.5" ry="1.9" fill="white" opacity="0.4" />
    </svg>
  );
}

export function AmbientPetal({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path d="M12 3.2c2.8 2.6 5.8 6.4 5.8 10.2A5.8 5.8 0 0 1 12 19.2 5.8 5.8 0 0 1 6.2 13.4c0-3.8 3-7.6 5.8-10.2Z" />
      <path
        d="M12 6.5v10.2"
        fill="none"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export function AmbientStreamer({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path d="M5 3.5c3.5 2.2 4.2 5.5 3.2 8.2-.9 2.4.2 4.6 2.8 6.2 2.2 1.4 4.4 1.2 6.5-.2" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M7.5 3.8c3.2 2 3.8 4.8 2.9 7.2" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

export function AmbientSun({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <circle cx="12" cy="12" r="4.2" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M16.9 5.4l-1.7 1.7M5.4 16.9l1.7-1.7" />
      </g>
    </svg>
  );
}

export function AmbientFirefly({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <circle cx="12" cy="12" r="3.2" opacity="0.95" />
      <circle cx="12" cy="12" r="6.5" opacity="0.22" />
      <circle cx="12" cy="12" r="9.5" opacity="0.1" />
      <circle cx="11" cy="11" r="1.1" fill="white" opacity="0.55" />
    </svg>
  );
}

export function AmbientRibbon({ size, ...rest }: GlyphProps) {
  return (
    <svg {...baseProps({ size, ...rest })}>
      <path d="M4.5 7.5c3.5-3 7-3 11 0 2.2 1.6 4.2 1.8 6 0" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M4.5 13c3.5-3 7-3 11 0 2.2 1.6 4.2 1.8 6 0" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}
