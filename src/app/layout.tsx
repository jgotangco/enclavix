import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Grand Enclave Residences | HOA Management System",
  description:
    "Official HOA Management, Billing, Security Compliance & Resident Portal for Grand Enclave Residences",
};

import { CommunitySettingsProvider } from "@/lib/context/community-settings";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900`}>
        <CommunitySettingsProvider>
          {children}
        </CommunitySettingsProvider>
      </body>
    </html>
  );
}
