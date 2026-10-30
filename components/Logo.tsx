import Link from "next/link";
import { CheckIcon } from "@/components/Icons";

type LogoProps = {
  href?: string;
  className?: string;
};

export function Logo({ href = "/", className = "" }: LogoProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${className}`}
      aria-label="Tandem home"
    >
      <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-ink text-lime shadow-[0_4px_12px_rgba(23,35,29,0.22)] transition-transform duration-300 group-hover:-rotate-6">
        <CheckIcon className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span className="text-[1.35rem] font-semibold tracking-[-0.04em] text-ink">
        tandem<span className="text-muted">.</span>
      </span>
    </Link>
  );
}
