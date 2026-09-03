"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavBar() {
  const path = usePathname() ?? "/";
  const historyActive = path.startsWith("/history");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-center gap-2 border-t border-hairline bg-surface px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5">
      <NavLink href="/" active={!historyActive}>
        Home
      </NavLink>
      <NavLink href="/history" active={historyActive}>
        History
      </NavLink>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-6 py-2 text-sm font-semibold transition",
        active
          ? "bg-[rgba(255,122,27,0.14)] text-accent"
          : "text-muted hover:text-content",
      )}
    >
      {children}
    </Link>
  );
}
