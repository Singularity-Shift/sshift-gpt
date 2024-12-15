import 'tailwindcss/tailwind.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '../src/components/ui/toaster';
import { ThemeProvider } from '../src/context/ThemeProvider';
import { WalletProvider } from '../src/context/WalletProvider';
import { BackendProvider } from '../src/context/BackendProvider';
import { AppManagementProvider } from '../src/context/AppManagment';
import { AbiProvider } from '../src/context/AbiProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sshift GPT',
  description: 'New AI generation platform base in Aptos blockchain',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            <BackendProvider>
              <AbiProvider>
                <AppManagementProvider>{children}</AppManagementProvider>
              </AbiProvider>
            </BackendProvider>
          </WalletProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
