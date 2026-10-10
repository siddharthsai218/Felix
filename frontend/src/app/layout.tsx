import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Felix — Adaptive Interview-Skills Coach',
  description: 'Practice interviews with AI coaching. Get formative feedback, behavioral insights, and personalized micro-drills.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-950 text-white antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-gray-950 text-white`}>
        {children}
      </body>
    </html>
  );
}
