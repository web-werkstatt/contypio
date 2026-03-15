import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'cms-sidebar-collapsed';

interface SidebarContextType {
  collapsed: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
  collapse: () => {},
  expand: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const persist = (val: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(val));
  };

  const toggle = useCallback(() => {
    setCollapsed((v) => {
      persist(!v);
      return !v;
    });
  }, []);

  const collapse = useCallback(() => {
    setCollapsed(true);
    persist(true);
  }, []);

  const expand = useCallback(() => {
    setCollapsed(false);
    persist(false);
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, collapse, expand }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
