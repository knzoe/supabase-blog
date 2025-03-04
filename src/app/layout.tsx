import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from '@/lib/providers/ReduxProvider';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import Navbar from '@/components/Navbar';
import Providers from '@/lib/providers/providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Supabase Blog",
  description: "A simple blog built with Next.js and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ReduxProvider>
            <QueryProvider>
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
            </QueryProvider>
          </ReduxProvider>
        </Providers>
      </body>
    </html>
  );
}
