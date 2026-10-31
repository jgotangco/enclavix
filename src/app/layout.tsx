import type { Metadata } from "next";
import "./globals.css";


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
      <body className={"min-h-full flex flex-col bg-slate-50 text-slate-900"}>
        <p role="note" className="bg-amber-100 text-amber-950 px-4 py-3 text-sm text-center">
          {process.env.NEXT_PUBLIC_APP_ENV === "demo"
            ? "Synthetic demo only. Changes are temporary. Do not use for payments, resident records, or gate decisions."
            : "Preview only. Resident access and operational services are not enabled yet."}
        </p>
        <CommunitySettingsProvider>
          {children}
        </CommunitySettingsProvider>
      </body>
    </html>
  );
}
