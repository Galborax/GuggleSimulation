import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';

export const metadata: Metadata = {
  title: 'GuggleSimulation - AI-Powered Market Analysis',
  description: 'AI-powered financial market analysis and investment decision support platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Navbar />
        <main className="min-h-screen bg-gray-900">
          {children}
        </main>
      </body>
    </html>
  );
}
