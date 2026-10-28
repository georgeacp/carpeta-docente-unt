import Providers from "@/app/providers";
import { cn } from "@/utils/cn";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Carpeta Docente - UNT",
    default: "Carpeta Docente - Universidad Nacional de Trujillo",
  },
  description:
    "Sistema Digital de Carpeta Docente de la Universidad Nacional de Trujillo para la gestión, versionado inmutable y dictamen de evidencias académicas.",
  icons: {
    icon: "/images/logo/logo-unt.png",
    shortcut: "/images/logo/logo-unt.png",
    apple: "/images/logo/logo-unt.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="es"
      className={cn("h-full antialiased", geistInter.className)}
    >
      <body className="h-full overflow-x-hidden bg-background-gray-secondary_alt_2">
        <ThemeProvider defaultTheme="light" enableSystem>
          <Providers>{children}</Providers>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
