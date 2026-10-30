import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m5 12.5 4.2 4.2L19 7" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </IconBase>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M19 12H5m6-6-6 6 6 6" />
    </IconBase>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
    </IconBase>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m3 0-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
      <path d="M10 11v5M14 11v5" />
    </IconBase>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M16 20v-1.7a4.3 4.3 0 0 0-4.3-4.3H6.3A4.3 4.3 0 0 0 2 18.3V20" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M22 20v-1.7a4.3 4.3 0 0 0-3.2-4.1M16.5 4a3.2 3.2 0 0 1 0 6.2" />
    </IconBase>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M13 2 4.7 13.2a.6.6 0 0 0 .5 1h5.6L11 22l8.3-11.2a.6.6 0 0 0-.5-1h-5.6L13 2Z" />
    </IconBase>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10.5 13.5a4.2 4.2 0 0 0 6 0l2.4-2.4a4.2 4.2 0 0 0-6-6l-1.4 1.4" />
      <path d="M13.5 10.5a4.2 4.2 0 0 0-6 0L5.1 12.9a4.2 4.2 0 0 0 6 6l1.4-1.4" />
    </IconBase>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15ZM19 13l.8 2.2L22 16l-2.2.8L19 19l-.8-2.2L16 16l2.2-.8L19 13Z" />
    </IconBase>
  );
}

export function LoaderIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 12a9 9 0 1 1-6.2-8.6" />
    </IconBase>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth={3} />
    </IconBase>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </IconBase>
  );
}

export function WifiIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01" strokeWidth={2} />
    </IconBase>
  );
}
