import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import api from '@/lib/api';
import type { Tenant, TenantBranding } from '@/types/cms';

interface TenantContextValue {
  tenant: Tenant | null;
  branding: TenantBranding;
  tenants: Tenant[];
  isLoading: boolean;
  switchTenant: (tenantId: string) => void;
  refreshTenant: () => Promise<void>;
}

const DEFAULT_BRANDING: TenantBranding = {
  name: 'Contypio',
  logo_url: null,
  primary_color: '#2563eb',
  accent_color: null,
  favicon_url: null,
};

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  branding: DEFAULT_BRANDING,
  tenants: [],
  isLoading: true,
  switchTenant: () => {},
  refreshTenant: async () => {},
});

function applyBrandingCSS(branding: TenantBranding): void {
  const root = document.documentElement;
  root.style.setProperty('--primary', branding.primary_color);

  // Compute darker shade for hover states
  const hex = branding.primary_color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 25);
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 25);
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 25);
  root.style.setProperty('--primary-dark', `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);

  // Compute light shade for backgrounds
  const lr = Math.min(255, parseInt(hex.substring(0, 2), 16) + 200);
  const lg = Math.min(255, parseInt(hex.substring(2, 4), 16) + 200);
  const lb = Math.min(255, parseInt(hex.substring(4, 6), 16) + 200);
  root.style.setProperty('--primary-light', `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`);

  if (branding.accent_color) {
    root.style.setProperty('--accent', branding.accent_color);
  }

  // Update favicon if provided
  if (branding.favicon_url) {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (link) {
      link.href = branding.favicon_url;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = branding.favicon_url;
      document.head.appendChild(newLink);
    }
  }

  // Update document title
  if (branding.name) {
    document.title = `${branding.name} - Contypio`;
  }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_BRANDING);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentTenant = useCallback(async () => {
    const token = localStorage.getItem('cms_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const [tenantRes, brandingRes] = await Promise.all([
        api.get<Tenant>('/api/tenants/current'),
        api.get<TenantBranding>('/api/tenants/current/branding'),
      ]);
      setTenant(tenantRes.data);
      setBranding(brandingRes.data);
      applyBrandingCSS(brandingRes.data);
    } catch {
      // If tenant fetch fails, use defaults - user might not be authenticated yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTenantList = useCallback(async () => {
    try {
      const res = await api.get<Tenant[]>('/api/tenants');
      setTenants(res.data);
    } catch {
      // Non-admins can't list tenants - that's fine
    }
  }, []);

  useEffect(() => {
    fetchCurrentTenant();
    fetchTenantList();
  }, [fetchCurrentTenant, fetchTenantList]);

  const switchTenant = useCallback((tenantId: string) => {
    localStorage.setItem('cms_active_tenant', tenantId);
    // Tenant switch requires re-login in the current architecture
    // since tenant_id is bound to the user
    const selected = tenants.find((t) => t.id === tenantId);
    if (selected) {
      setTenant(selected);
      const newBranding: TenantBranding = {
        name: selected.name,
        logo_url: selected.logo_url,
        primary_color: selected.primary_color || '#2563eb',
        accent_color: selected.accent_color,
        favicon_url: selected.favicon_url,
      };
      setBranding(newBranding);
      applyBrandingCSS(newBranding);
    }
  }, [tenants]);

  const refreshTenant = useCallback(async () => {
    await fetchCurrentTenant();
  }, [fetchCurrentTenant]);

  return (
    <TenantContext.Provider value={{ tenant, branding, tenants, isLoading, switchTenant, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext(): TenantContextValue {
  return useContext(TenantContext);
}
