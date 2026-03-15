interface SeoData {
  title: string;
  description: string;
}

interface PageSeoTabProps {
  seo: SeoData;
  onSeoChange: (seo: SeoData) => void;
  pageTitle: string;
  pagePath: string | undefined;
}

export default function PageSeoTab({ seo, onSeoChange, pageTitle, pagePath }: PageSeoTabProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold">Suchmaschinenoptimierung</h2>
        <div>
          <label className="block text-xs font-medium mb-1">SEO Titel</label>
          <input
            value={seo.title}
            onChange={(e) => onSeoChange({ ...seo, title: e.target.value })}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm"
            placeholder="Seitentitel für Suchmaschinen"
          />
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${seo.title.length > 60 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
              {seo.title.length}/60 Zeichen
            </span>
            {seo.title.length > 0 && seo.title.length <= 60 && (
              <span className="text-xs text-green-600">Gut</span>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Meta Description</label>
          <textarea
            value={seo.description}
            onChange={(e) => onSeoChange({ ...seo, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm resize-none"
            placeholder="Beschreibung für Suchmaschinen"
          />
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${seo.description.length > 160 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
              {seo.description.length}/160 Zeichen
            </span>
            {seo.description.length > 0 && seo.description.length <= 160 && (
              <span className="text-xs text-green-600">Gut</span>
            )}
          </div>
        </div>
        {/* Google Preview */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-xs text-[var(--text-muted)] mb-2 font-medium">Google-Vorschau</div>
          <div className="text-base text-blue-700 truncate">{seo.title || pageTitle || 'Seitentitel'}</div>
          <div className="text-xs text-green-700 truncate mt-0.5">{pagePath ? `example.com${pagePath}` : 'example.com/...'}</div>
          <div className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">{seo.description || 'Beschreibung der Seite...'}</div>
        </div>
      </div>
    </div>
  );
}
