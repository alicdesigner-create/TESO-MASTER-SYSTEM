"use client";

import { createContext, useContext, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";

interface NavigationGuardContextValue {
  registerBlock: (label: string) => void;
  unregisterBlock: () => void;
  requestNavigation: (href: string) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextValue>({
  registerBlock: () => {},
  unregisterBlock: () => {},
  requestNavigation: () => {},
});

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const blockedRef = useRef(false);
  const labelRef = useRef("documento");
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const registerBlock = useCallback((label: string) => {
    blockedRef.current = true;
    labelRef.current = label;
  }, []);

  const unregisterBlock = useCallback(() => {
    blockedRef.current = false;
  }, []);

  const requestNavigation = useCallback((href: string) => {
    if (blockedRef.current) {
      setPendingHref(href);
    } else {
      router.push(href);
    }
  }, [router]);

  const confirmLeave = () => {
    blockedRef.current = false;
    const href = pendingHref;
    setPendingHref(null);
    if (href) router.push(href);
  };

  const cancelLeave = () => {
    setPendingHref(null);
  };

  return (
    <NavigationGuardContext.Provider value={{ registerBlock, unregisterBlock, requestNavigation }}>
      {children}
      <Modal open={pendingHref !== null} onClose={cancelLeave} title="¿Salir sin guardar?">
        <div>
          <p style={{ fontSize: 14, color: "var(--text-primary)", margin: "0 0 20px", lineHeight: 1.6 }}>
            Alirio, tienes cambios sin guardar en esta {labelRef.current}. ¿Deseas salir sin guardar?
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={cancelLeave} style={btnStay}>Seguir editando</button>
            <button onClick={confirmLeave} style={btnLeave}>Salir sin guardar</button>
          </div>
        </div>
      </Modal>
    </NavigationGuardContext.Provider>
  );
}

const btnStay: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "var(--beige)",
  color: "var(--carbon)",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};
const btnLeave: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "transparent",
  color: "var(--red-text)",
  border: "1px solid var(--red-bg)",
  borderRadius: 5,
  cursor: "pointer",
  fontSize: 13,
};
