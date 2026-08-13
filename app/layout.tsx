import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { NavigationGuardProvider } from "@/contexts/NavigationGuard";

export const metadata: Metadata = {
  title: "TESO Master System",
  description: "Internal management system — Teso Graphics LLC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, display: "flex", minHeight: "100vh" }}>
        <NavigationGuardProvider>
          <Sidebar />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "auto" }}>
            {children}
          </div>
        </NavigationGuardProvider>
      </body>
    </html>
  );
}
