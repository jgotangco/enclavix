import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Enclavix | Community account",
  description:
    "Enclavix web and Android community platform for villages and condominiums",
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
            : "Development preview. Use synthetic data only; finance and gate operations are disabled."}
        </p>
        <CommunitySettingsProvider>
          {children}
        </CommunitySettingsProvider>
      </body>
    </html>
  );
}
