import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import Navbar, { NavbarFallback } from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartProvider from "@/components/CartProvider";
import LanguageProvider from "@/components/LanguageProvider";
import { categoryNavItems } from "@/lib/data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NextMart — Shop the Future",
  description:
    "NextMart — Shop the Future. Premium tech, gadgets and everyday essentials, handpicked, fairly priced, and shipped fast across Bangladesh.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden"
      cz-shortcut-listen="true">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <CartProvider>
            {/* ভাষা (বাংলা/ইংরেজি) সব পেজে শেয়ার হয় */}
            <LanguageProvider>
              {/* usePathname ডাইনামিক রুটে প্রি-রেন্ডারে পাওয়া যায় না — তাই Suspense */}
              <Suspense fallback={<NavbarFallback />}>
                {/* ক্যাটাগরি বারের হালকা ডেটা সার্ভার থেকে প্রস হিসেবে যায় (১ MB ডাটা ক্লায়েন্টে নয়) */}
                <Navbar categories={categoryNavItems} />
              </Suspense>
              <main className="flex-1">{children}</main>
              <Footer />
              {/* টোস্ট নোটিফিকেশন (sonner) */}
              <Toaster richColors position="top-center" closeButton />
            </LanguageProvider>
        </CartProvider>
      </body>
    </html>
  );
}
