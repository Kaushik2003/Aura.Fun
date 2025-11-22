import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { Navigation } from "../components/navigation";
import { ErrorBoundary } from "../components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aura.Farm - Creator Token Platform",
  description: "A decentralized platform for creator tokens backed by dual collateral",
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
        <ErrorBoundary>
          <Providers>
            <Navigation />
            <main>
              {children}
            </main>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  color: '#374151',
                },
              }}
            />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
