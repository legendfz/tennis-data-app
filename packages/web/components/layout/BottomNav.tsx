"use client";

import { Home, Trophy, Tv, Search, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
  { label: "Home", href: "/", icon: Home },
  { label: "Rankings", href: "/rankings", icon: Trophy },
  { label: "Matches", href: "/matches", icon: Tv },
  { label: "Search", href: "/search", icon: Search },
  { label: "Favorites", href: "/favorites", icon: Star },
] as const;

/**
 * Fixed bottom navigation bar for mobile screens.
 * Hidden on md and above breakpoints.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-background-surface md:hidden"
      aria-label="Mobile navigation"
    >
      {tabs.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-xs transition-colors",
              isActive
                ? "text-tennis-green"
                : "text-text-secondary hover:text-text-primary"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
