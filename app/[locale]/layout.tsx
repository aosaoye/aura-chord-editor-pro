import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chord Editor Pro",
  description: "Crea partituras con acordes y letra",
};

import { ThemeProvider } from "./components/ThemeProvider";
import { SettingsProvider } from "./context/SettingsContext";
import NotificationToast from "./components/NotificationToast";

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();
  return (
    <ClerkProvider
      appearance={{
        layout: {
          showOptionalFields: false,
        },
        variables: {
          colorPrimary: 'var(--primary)',
          colorText: 'var(--foreground)',
          colorBackground: 'var(--background)',
          colorInputBackground: 'var(--muted)',
          colorInputText: 'var(--foreground)',
          colorDanger: 'red',
        },
        elements: {
          cardBox: {
            boxShadow: '0px 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid var(--border)',
            borderRadius: '1.5rem',
          },
          card: {
            backgroundColor: 'var(--background)',
          },
          headerTitle: { 
            color: 'var(--foreground)',
            fontSize: '1.5rem',
            fontWeight: 'bold',
          },
          headerSubtitle: { 
            color: 'var(--muted-foreground)',
          },
          socialButtonsBlockButton: { 
            border: '1px solid var(--border)', 
            color: 'var(--foreground)',
            backgroundColor: 'var(--background)'
          },
          socialButtonsBlockButtonText: { 
            color: 'var(--foreground)', 
            fontWeight: '600' 
          },
          formButtonPrimary: {
             backgroundColor: 'var(--primary)',
             color: 'white',
             border: 'none',
             fontWeight: 'bold'
          },
          footer: { display: "none" },
          footerAction: { display: "none" },
          userButtonPopoverFooter: { display: "none" },
          watermark: { display: "none", opacity: 0 },
        }
      }}
    >
      <html lang={locale} suppressHydrationWarning className="overflow-x-hidden">
        <body className={`${jakartaSans.variable} antialiased overflow-x-hidden w-full max-w-[100vw]`}>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <SettingsProvider>
                {children}
                <NotificationToast />
              </SettingsProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
