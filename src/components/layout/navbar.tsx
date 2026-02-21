'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, BarChart2, Newspaper, Brain, Activity } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: Activity },
  { href: '/market-data', label: 'Market Data', icon: BarChart2 },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/analysis', label: 'Analysis', icon: Brain },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <TrendingUp className="h-7 w-7 text-blue-400" />
              <span className="text-xl font-bold text-white">GuggleSimulation</span>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === href
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-green-900/30 border border-green-700 px-3 py-1.5 rounded-full">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs font-medium">Live Data</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
