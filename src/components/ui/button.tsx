import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  variant?: "primary" | "outline" | "ghost";
} & ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

export function Button({ children, className, href, variant = "primary", ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200 disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" && "bg-teal-300 text-slate-950 hover:bg-teal-200",
    variant === "outline" && "border border-white/15 bg-white/[0.03] text-slate-100 hover:border-teal-200/60 hover:bg-teal-200/10",
    variant === "ghost" && "text-slate-200 hover:bg-white/10 hover:text-white",
    className,
  );

  if (href) {
    return (
      <Link className={classes} href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
