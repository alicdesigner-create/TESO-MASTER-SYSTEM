"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  RefreshCw,
  Globe,
  DollarSign,
  FileText,
  Receipt,
  Bell,
} from "lucide-react";
import { useNavigationGuard } from "@/contexts/NavigationGuard";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/projects", icon: FolderOpen, label: "Projects" },
  { href: "/subscriptions", icon: RefreshCw, label: "Subscriptions" },
  { href: "/websites", icon: Globe, label: "Websites" },
  { href: "/finance", icon: DollarSign, label: "Finance" },
  { href: "/quotes", icon: FileText, label: "Quotes" },
  { href: "/invoices", icon: Receipt, label: "Invoices" },
];

interface SidebarProps {
  alertCount?: number;
}

export default function Sidebar({ alertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { requestNavigation } = useNavigationGuard();

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        backgroundColor: "var(--bg-sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid var(--sidebar-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              backgroundColor: "var(--beige)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--carbon)",
              letterSpacing: "-0.5px",
              flexShrink: 0,
            }}
          >
            T
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "var(--sidebar-text)",
                letterSpacing: "0.5px",
              }}
            >
              TESO
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--sidebar-muted)",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              Master System
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <a
              key={href}
              href={href}
              onClick={(e) => { e.preventDefault(); requestNavigation(href); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 20px",
                color: isActive ? "var(--beige)" : "var(--sidebar-muted)",
                backgroundColor: isActive ? "var(--sidebar-active-bg)" : "transparent",
                borderLeft: isActive ? "2px solid var(--beige)" : "2px solid transparent",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                transition: "all 0.15s",
                cursor: "pointer",
              }}
            >
              <Icon size={15} />
              {label}
            </a>
          );
        })}
      </nav>

      {/* Alert badge */}
      {alertCount > 0 && (
        <div
          style={{
            margin: "0 12px 16px",
            padding: "10px 12px",
            backgroundColor: "rgba(253,244,216,0.08)",
            border: "1px solid rgba(232,197,71,0.25)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Bell size={13} color="#e8c547" />
          <span style={{ fontSize: 12, color: "#e8c547" }}>
            {alertCount} alert{alertCount !== 1 ? "s" : ""} active
          </span>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--sidebar-border)",
          fontSize: 10,
          color: "var(--sidebar-muted)",
          letterSpacing: "0.5px",
        }}
      >
        TESO GRAPHICS LLC · 2026
      </div>
    </aside>
  );
}
