import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | TennisHQ',
    default: 'TennisHQ — Tennis Data Intelligence',
  },
  description:
    'Live scores, player stats, H2H records, and tournament data for tennis fans and analysts.',
  keywords: ['tennis', 'live scores', 'ATP', 'WTA', 'player stats', 'tennis data'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-gray-800 bg-gray-900">
            <div className="container-app flex h-14 items-center justify-between">
              <a href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-brand-400">TennisHQ</span>
              </a>
              <nav className="flex items-center gap-6 text-sm text-gray-400">
                <a href="/players" className="hover:text-gray-100 transition-colors">
                  Players
                </a>
                <a href="/tournaments" className="hover:text-gray-100 transition-colors">
                  Tournaments
                </a>
                <a href="/matches" className="hover:text-gray-100 transition-colors">
                  Matches
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-800 bg-gray-900 py-6 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} TennisHQ. Tennis data intelligence.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
