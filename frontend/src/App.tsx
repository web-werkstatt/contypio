import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { TenantProvider } from '@/contexts/TenantContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import AppLayout from '@/components/layout/AppLayout';
import SettingsLayout from '@/components/layout/SettingsLayout';
import CollectionsLayout from '@/components/layout/CollectionsLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import PageEditor from '@/pages/PageEditor';
import MediaLibrary from '@/pages/MediaLibrary';
import CollectionsList from '@/pages/CollectionsList';
import CollectionEditor from '@/pages/CollectionEditor';
import CollectionTrash from '@/pages/CollectionTrash';
import CollectionImport from '@/pages/CollectionImport';
import GlobalEditor from '@/pages/GlobalEditor';
import SchemaEditor from '@/pages/SchemaEditor';
import ImportWizard from '@/pages/ImportWizard';
import ArchivedPages from '@/pages/ArchivedPages';
import OnboardingWizard from '@/pages/OnboardingWizard';
import Profile from '@/pages/Profile';
import UsagePlan from '@/pages/UsagePlan';
import Billing from '@/pages/Billing';
import PricingAdmin from '@/pages/PricingAdmin';
import WebhooksPage from '@/pages/WebhooksPage';
import ModulesPage from '@/pages/ModulesPage';
import WebsiteImporterPage from '@/pages/WebsiteImporterPage';
import ApiKeysPage from '@/pages/ApiKeysPage';
import ContentTemplatesPage from '@/pages/ContentTemplatesPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center text-sm text-[var(--text-muted)]">Laden...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <SidebarProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="pages/archived" element={<ArchivedPages />} />
              <Route path="pages/:id" element={<PageEditor />} />
              <Route path="media" element={<MediaLibrary />} />
              <Route path="content-templates" element={<ContentTemplatesPage />} />
              {/* Collections mit eigener Sub-Navigation */}
              <Route path="collections" element={<CollectionsLayout />}>
                <Route index element={<CollectionsList />} />
                <Route path="new" element={<SchemaEditor />} />
                <Route path=":key/edit" element={<SchemaEditor />} />
                <Route path=":key" element={<CollectionEditor />} />
                <Route path=":key/trash" element={<CollectionTrash />} />
                <Route path=":key/import" element={<CollectionImport />} />
              </Route>
              <Route path="profile" element={<Profile />} />
              <Route path="usage" element={<UsagePlan />} />
              <Route path="billing" element={<Billing />} />
              <Route path="pricing" element={<PricingAdmin />} />

              {/* Settings mit eigener Sub-Navigation */}
              <Route path="settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="general" replace />} />
                <Route path="general" element={<GlobalEditor />} />
                <Route path="navigation" element={<GlobalEditor />} />
                <Route path="social-media" element={<GlobalEditor />} />
                <Route path="webhooks" element={<WebhooksPage />} />
                <Route path="api-keys" element={<ApiKeysPage />} />
                <Route path="import" element={<ImportWizard />} />
                <Route path="website-import" element={<WebsiteImporterPage />} />
                <Route path="modules" element={<ModulesPage />} />
              </Route>

              {/* Legacy-Routen: Redirect zu Settings */}
              <Route path="globals/:slug" element={<GlobalEditor />} />
              <Route path="webhooks" element={<Navigate to="/settings/webhooks" replace />} />
              <Route path="modules" element={<Navigate to="/settings/modules" replace />} />
              <Route path="import" element={<Navigate to="/settings/import" replace />} />
              <Route path="website-import" element={<Navigate to="/settings/website-import" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </SidebarProvider>
      </TenantProvider>
    </QueryClientProvider>
  );
}
