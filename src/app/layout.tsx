import type { Metadata, Viewport } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'El Ele – Deprem Yardım Ağı',
  description:
    'Depremde yardıma ihtiyacı olanlarla yardım edebilecekleri buluşturan, son depremleri gösteren ve depreme hazırlığa yardım eden ücretsiz uygulama.',
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col">
        <Header />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
