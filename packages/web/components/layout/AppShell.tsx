import { BottomNav } from "./BottomNav";
import Link from "next/link";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Top-level layout wrapper providing the app header, main content area, and mobile bottom nav.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-tennis-green-light">TennisHQ</span>
          </Link>
          {/* Desktop nav — hidden on mobile since BottomNav handles it */}
          <nav className="hidden items-center gap-6 text-sm text-text-secondary md:flex">
            <Link href="/players" className="transition-colors hover:text-text-primary">
              Players
            </Link>
            <Link href="/tournaments" className="transition-colors hover:text-text-primary">
              Tournaments
            </Link>
            <Link href="/matches" className="transition-colors hover:text-text-primary">
              Matches
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>

      {/* Footer — desktop only */}
      <footer className="hidden border-t border-white/10 bg-background-surface py-6 text-center text-sm text-text-disabled md:block">
        <p>© {new Date().getFullYear()} TennisHQ. Tennis data intelligence.</p>
      </footer>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
