import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export const Icons = {
  home: (props: IconProps) => <Icon {...props}><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></Icon>,
  library: (props: IconProps) => <Icon {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></Icon>,
  chart: (props: IconProps) => <Icon {...props}><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></Icon>,
  collection: (props: IconProps) => <Icon {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Icon>,
  search: (props: IconProps) => <Icon {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></Icon>,
  plus: (props: IconProps) => <Icon {...props}><path d="M12 5v14M5 12h14"/></Icon>,
  close: (props: IconProps) => <Icon {...props}><path d="m6 6 12 12M18 6 6 18"/></Icon>,
  arrow: (props: IconProps) => <Icon {...props}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>,
  spark: (props: IconProps) => <Icon {...props}><path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></Icon>,
  more: (props: IconProps) => <Icon {...props}><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></Icon>,
  download: (props: IconProps) => <Icon {...props}><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></Icon>,
  bookOpen: (props: IconProps) => <Icon {...props}><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z"/></Icon>,
};
