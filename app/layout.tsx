import type { Metadata } from 'next';
import { Poppins, Open_Sans } from 'next/font/google';
import './globals.css';
import ConvexClientProvider from '@/components/ConvexClientProvider';
import { ThemeProvider } from '@/components/theme-provider';

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  subsets: ['latin'],
  display: 'swap',
});

const openSans = Open_Sans({
  weight: ['400', '500', '600', '700'],
  variable: '--font-open-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mission Control',
  description: 'Multi-agent task coordination system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${openSans.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
