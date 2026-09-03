import type { ReactNode } from "react";
import Link from "next/link";

/** Page container: centered, mobile-first, with room for the bottom nav. */
export function Container({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-[640px] px-4 pb-24 pt-5 md:max-w-[720px] md:pb-16 md:pt-8">
      {children}
    </main>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="my-1 text-[26px] font-bold">{children}</h1>;
}

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="mb-3 inline-block text-[15px] text-accent">
      ‹ {children}
    </Link>
  );
}
