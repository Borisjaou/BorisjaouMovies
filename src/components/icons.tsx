import type { ReactElement, SVGProps } from "react";

/**
 * Иконки 1:1 из эталона (viewBox 24×24). Цвет — через currentColor.
 * Для каждой иконки заданы атрибуты по умолчанию из макета;
 * size / strokeWidth / filled переопределяются там, где макет отличается.
 */

type Kind = "stroke" | "fill";

interface IconDef {
  kind: Kind;
  strokeWidth?: number;
  linecap?: "round";
  linejoin?: "round";
  body: ReactElement;
}

const ICONS = {
  sun: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    linejoin: "round",
    body: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
  },
  moon: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    linejoin: "round",
    body: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  },
  search: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    body: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </>
    ),
  },
  sliders: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    body: (
      <>
        <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="10" cy="17" r="2" />
      </>
    ),
  },
  heart: {
    kind: "stroke",
    strokeWidth: 1.8,
    linejoin: "round",
    body: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  },
  share: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    linejoin: "round",
    body: <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />,
  },
  star: {
    kind: "fill",
    body: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  },
  close: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    body: <path d="M6 6l12 12M18 6L6 18" />,
  },
  back: {
    kind: "stroke",
    strokeWidth: 2,
    linecap: "round",
    linejoin: "round",
    body: <path d="M15 5l-7 7 7 7" />,
  },
  check: {
    kind: "stroke",
    strokeWidth: 2.4,
    linecap: "round",
    linejoin: "round",
    body: <path d="M5 12l5 5 9-10" />,
  },
  play: {
    kind: "fill",
    body: <path d="M8 5v14l11-7z" />,
  },
  eye: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    linejoin: "round",
    body: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  link: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    body: (
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    ),
  },
  plus: {
    kind: "stroke",
    strokeWidth: 2.2,
    linecap: "round",
    body: <path d="M12 5v14M5 12h14" />,
  },
  edit: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    linejoin: "round",
    body: (
      <>
        <path d="M4 20h4L19 9l-4-4L4 16z" />
        <path d="M13 7l4 4" />
      </>
    ),
  },
  upload: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    linejoin: "round",
    body: <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />,
  },
  sort: {
    kind: "stroke",
    strokeWidth: 2,
    linecap: "round",
    body: <path d="M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3" />,
  },
  home: {
    kind: "stroke",
    strokeWidth: 1.8,
    linejoin: "round",
    body: <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  },
  grid: {
    kind: "stroke",
    strokeWidth: 1.8,
    body: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="2" />
        <rect x="13" y="4" width="7" height="7" rx="2" />
        <rect x="4" y="13" width="7" height="7" rx="2" />
        <rect x="13" y="13" width="7" height="7" rx="2" />
      </>
    ),
  },
  user: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    body: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </>
    ),
  },
  send: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    linejoin: "round",
    body: (
      <>
        <path d="M21 3L3 10.5l7 2.5 2.5 7z" />
        <path d="M10 13l11-10" />
      </>
    ),
  },
  message: {
    kind: "stroke",
    strokeWidth: 1.8,
    linejoin: "round",
    body: <path d="M4 5h16v11H9l-5 4z" />,
  },
  globe: {
    kind: "stroke",
    strokeWidth: 1.8,
    linecap: "round",
    linejoin: "round",
    body: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
  },
  mail: {
    kind: "stroke",
    strokeWidth: 1.8,
    linejoin: "round",
    body: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </>
    ),
  },
  more: {
    kind: "fill",
    body: (
      <>
        <circle cx="5" cy="12" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="19" cy="12" r="1.8" />
      </>
    ),
  },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

type SvgAttrs = Omit<SVGProps<SVGSVGElement>, "children" | "fill" | "stroke" | "strokeWidth">;

export interface IconProps extends SvgAttrs {
  name: IconName;
  /** Ширина и высота, px */
  size: number;
  /** Толщина линии, если в макете отличается от значения по умолчанию */
  strokeWidth?: number;
  /** Залить контур (сердце в избранном) */
  filled?: boolean;
}

export function Icon({ name, size, strokeWidth, filled = false, ...rest }: IconProps) {
  const def: IconDef = ICONS[name];

  if (def.kind === "fill") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
        {def.body}
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth ?? def.strokeWidth}
      strokeLinecap={def.linecap}
      strokeLinejoin={def.linejoin}
      aria-hidden="true"
      {...rest}
    >
      {def.body}
    </svg>
  );
}
