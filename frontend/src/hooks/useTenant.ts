import { useTenantContext } from '@/contexts/TenantContext';

/**
 * Hook fuer Zugriff auf den aktuellen Tenant und sein Branding.
 * Wrapper um TenantContext fuer bequemen Zugriff in Komponenten.
 */
export function useTenant() {
  const { tenant, branding, tenants, isLoading, switchTenant, refreshTenant } = useTenantContext();

  return {
    /** Aktueller Tenant (null wenn nicht geladen) */
    tenant,
    /** Branding-Konfiguration (Farben, Logo, etc.) */
    branding,
    /** Liste aller verfuegbaren Tenants (nur fuer Admins) */
    tenants,
    /** Laedt noch */
    isLoading,
    /** Zu anderem Tenant wechseln */
    switchTenant,
    /** Tenant-Daten neu laden */
    refreshTenant,
    /** Tenant-Name (Fallback: 'Contypio') */
    tenantName: branding.name || 'Contypio',
    /** Primaerfarbe */
    primaryColor: branding.primary_color,
    /** Hat das Tenant ein Logo? */
    hasLogo: !!branding.logo_url,
  };
}
