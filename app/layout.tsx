import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "JobSignal — TimeVision",
  description:
    "Piattaforma interna TimeVision per monitorare le posizioni aperte pubblicate da altre aziende su LinkedIn, Indeed e siti aziendali.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider attribute="class">{children}</ThemeProvider>
      </body>
    </html>
  );
}
