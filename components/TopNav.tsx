"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { MoodBear } from "./MoodBear";
import { signOut } from "@/lib/auth";

/** Desktop top navigation (hidden on mobile, where the bottom NavBar is used). */
export function TopNav() {
  const path = usePathname() ?? "/";
  const historyActive = path.startsWith("/history");

  return (
    <header className="hidden border-b border-hairline bg-surface md:block">
      <div className="mx-auto flex max-w-[720px] items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <MoodBear mood="strong" size={30} />
          <span className="text-base font-extrabold">Train to be fit</span>
        </Link>
        <nav className="flex items-center gap-1">
          <TopLink href="/" active={!historyActive}>
            Home
          </TopLink>
          <TopLink href="/history" active={historyActive}>
            History
          </TopLink>
        </nav>
        <button
          type="button"
          onClick={() => signOut()}
          className="ml-auto text-sm text-muted hover:text-content"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

function TopLink({
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
        "rounded-full px-4 py-1.5 text-sm font-semibold transition",
        active
          ? "bg-[rgba(255,122,27,0.14)] text-accent"
          : "text-muted hover:text-content",
      )}
    >
      {children}
    </Link>
  );
}
