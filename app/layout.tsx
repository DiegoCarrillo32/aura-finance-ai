import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ThemeProvider } from "./theme-provider";
import { AuthGuard } from "@/components/auth-guard";

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Aura Finance AI",
  description: "Premium AI-Powered Financial Analysis & Savings Planner",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aura Finance",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground flex flex-col antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Providers>
            <AuthGuard>
              {children}
            </AuthGuard>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
