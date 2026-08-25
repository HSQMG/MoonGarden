import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hành trình của em',
  description: 'Một góc nhỏ lưu giữ những câu chuyện, cột mốc và hành trình đáng nhớ của em.',
  openGraph: {
    title: 'Hành trình của em',
    description: 'Một góc nhỏ lưu giữ những điều đẹp đẽ về em.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Hành trình của em' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hành trình của em',
    description: 'Một góc nhỏ lưu giữ những điều đẹp đẽ về em.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
