import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
