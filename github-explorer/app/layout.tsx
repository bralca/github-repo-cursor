import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MainLayout } from "@/components/layout/main-layout";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Log server startup time
const SERVER_START_TIME = new Date();
console.log(`[SERVER] Initializing Next.js application at ${SERVER_START_TIME.toISOString()}`);
console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[SERVER] Node version: ${process.version}`);
console.log(`[SERVER] Working directory: ${process.cwd()}`);
console.log(`[SERVER] Database path: ${process.env.DB_PATH}`);
if (!process.env.DB_PATH) {
  console.error(`[SERVER] ERROR: DB_PATH environment variable is not set. This will cause database connection issues.`);
}

export const metadata: Metadata = {
  title: "GitHub Explorer",
  description: "Explore GitHub repositories, contributors, merge requests, and commits",
  keywords: ["github", "explorer", "analytics", "repository", "contributor", "merge request", "commit"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}
