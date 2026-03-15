import type { Page, CollectionSchema } from '@/types/cms';

interface PageSettingsTabProps {
  path: string;
  onPathChange: (path: string, slug: string) => void;
  parentId: number | null;
  onParentIdChange: (parentId: number | null) => void;
  pageType: string;
  onPageTypeChange: (pageType: string) => void;
  collectionKey: string;
  onCollectionKeyChange: (key: string) => void;
  allPages: Page[] | undefined;
  currentPageId: number | undefined;
  collections: CollectionSchema[] | undefined;
  tenantDomain: string | null | undefined;
}

export default function PageSettingsTab({
  path,
  onPathChange,
  parentId,
  onParentIdChange,
  pageType,
  onPageTypeChange,
  collectionKey,
  onCollectionKeyChange,
  allPages,
  currentPageId,
  collections,
  tenantDomain,
}: PageSettingsTabProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Gruppe: Seite */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Seite</h2>
        <div>
          <label className="block text-xs font-medium mb-1">Seitenadresse</label>
          <div className="flex items-center gap-0 border border-[var(--border)] rounded-md overflow-hidden">
            <span className="px-3 py-2 text-sm text-[var(--text-muted)] bg-gray-50 border-r border-[var(--border)] whitespace-nowrap select-none">
              {tenantDomain || 'example.com'}
            </span>
            <input
              value={path}
              onChange={(e) => {
                const val = e.target.value.startsWith('/') ? e.target.value : `/${e.target.value}`;
                const slug = val.replace(/^\//, '').replace(/\/$/, '');
                onPathChange(val, slug);
              }}
              className="flex-1 px-3 py-2 text-sm font-mono border-none outline-none"
              placeholder="/meine-seite"
            />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">Die Adresse, unter der die Seite im Web erreichbar ist.</p>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Übergeordnete Seite</label>
          <select
            value={parentId ?? ''}
            onChange={(e) => onParentIdChange(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm"
          >
            <option value="">Keine (Hauptebene)</option>
            {allPages?.filter((p) => p.id !== (currentPageId ?? -1)).map((p) => (
              <option key={p.id} value={p.id}>{p.title} (/{p.slug})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Gruppe: Seitenaufbau */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Seitenaufbau</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Seitenvorlage</label>
            <select
              value={pageType}
              onChange={(e) => onPageTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm"
            >
              <option value="content">Standardseite</option>
              <option value="landing">Landing Page</option>
              <option value="portal">Portal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Datenquelle</label>
            <select
              value={collectionKey}
              onChange={(e) => onCollectionKeyChange(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm"
            >
              <option value="">Keine</option>
              {collections?.map((c) => (
                <option key={c.collection_key} value={c.collection_key}>{c.label} ({c.item_count})</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
