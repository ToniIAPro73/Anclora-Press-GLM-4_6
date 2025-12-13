import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/language-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anclora Press - Plataforma de Publishing Digital",
  description: "Herramienta moderna para crear, editar y publicar libros digitales. Completa, intuitiva y potente.",
  keywords: ["publishing", "ebooks", "edición", "libros digitales", "Anclora Press"],
  authors: [{ name: "Anclora Press Team" }],
  openGraph: {
    title: "Anclora Press - Publishing Digital",
    description: "Crea y publica tu libro digital fácilmente",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-slate-950 text-foreground transition-colors duration-300`}
      >
        <LanguageProvider>
          {children}
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
