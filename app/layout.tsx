import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StockMind - AI-Powered Stock Prediction',
  description: 'Advanced stock market analysis and prediction tool powered by AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}