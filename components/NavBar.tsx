"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavBar() {
  const path = usePathname() ?? "/";
  const historyActive = path.startsWith("/history");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-hairline bg-surface pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
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
        "flex-1 p-1.5 text-center text-xs",
        active ? "font-semibold text-accent" : "text-muted",
      )}
    >
      {children}
    </Link>
  );
}
